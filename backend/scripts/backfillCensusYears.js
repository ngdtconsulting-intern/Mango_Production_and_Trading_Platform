/**
 * One-off migration: bring surveys recorded before the census rework up to the
 * current schema.
 *
 * For every survey it:
 *   1. assigns `surveyYearBS`, inferred from when the survey was submitted,
 *   2. copies the hard-coded 2082/2081 earnings into the year-relative fields,
 *   3. recomputes expected production and the yield gap from the tree ages.
 *
 * Run it BEFORE starting the server for the first time after this change.
 * The Survey model now carries a unique index on { farmerId, surveyYearBS };
 * with `surveyYearBS` missing, every legacy record indexes as null, so a
 * farmer with two old surveys would block the index from building.
 *
 *   node scripts/backfillCensusYears.js           # apply
 *   node scripts/backfillCensusYears.js --dry-run # report only, change nothing
 *
 * Safe to run more than once: records that already have a census year are
 * left alone unless --recalculate is passed.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

import Survey from '../models/Survey.js';
import { getCurrentBsYear } from '../utils/constants.js';

const DRY_RUN = process.argv.includes('--dry-run');
const RECALCULATE_ALL = process.argv.includes('--recalculate');

const log = (...args) => console.log('[backfill]', ...args);

const run = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set. Check backend/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  log(`connected to ${mongoose.connection.name}`);
  if (DRY_RUN) log('DRY RUN — no documents will be written');

  // `surveyYearBS` has a schema default, and Mongoose applies defaults when it
  // hydrates a document. A survey loaded through the model therefore always
  // *looks* like it has a census year, even when the stored document has none.
  // The raw driver is the only way to see what is actually persisted.
  const rawCollection = mongoose.connection.db.collection(Survey.collection.name);

  const rawMissingYear = await rawCollection
    .find({ surveyYearBS: { $exists: false } }, { projection: { _id: 1 } })
    .toArray();
  const missingYearIds = new Set(rawMissingYear.map((d) => String(d._id)));

  // The derived yield fields are new too, and are masked by their defaults in
  // exactly the same way, so they need the same raw check.
  const rawMissingDerived = await rawCollection
    .find({ expectedProductionKg: { $exists: false } }, { projection: { _id: 1 } })
    .toArray();
  const missingDerivedIds = new Set(rawMissingDerived.map((d) => String(d._id)));

  const surveys = await Survey.find({}).sort({ farmerId: 1, createdAt: 1 });
  log(
    `${surveys.length} survey(s) found — ${missingYearIds.size} without a stored census year, ` +
      `${missingDerivedIds.size} without derived yield fields`
  );

  // Track which years each farmer already occupies, so two legacy surveys by
  // the same farmer never collide on the new unique index.
  const takenYears = new Map(); // farmerId -> Set<year>
  const claim = (farmerId, year) => {
    const key = String(farmerId);
    if (!takenYears.has(key)) takenYears.set(key, new Set());
    const taken = takenYears.get(key);
    let candidate = year;
    // Walk backwards through earlier census years until a free slot is found.
    while (taken.has(candidate)) candidate -= 1;
    taken.add(candidate);
    return candidate;
  };

  // Seed with years genuinely stored, so a partial previous run is respected.
  surveys.forEach((s) => {
    if (!missingYearIds.has(String(s._id)) && s.surveyYearBS) {
      claim(s.farmerId, s.surveyYearBS);
    }
  });

  let assigned = 0;
  let recalculated = 0;
  let shifted = 0;
  let failed = 0;

  for (const survey of surveys) {
    const needsYear = missingYearIds.has(String(survey._id));

    if (needsYear) {
      // Infer the census year from the submission date rather than defaulting
      // everything to the current year, so historic records stay historic.
      const submittedAt = survey.createdAt ? new Date(survey.createdAt) : new Date();
      const inferred = Number.isNaN(submittedAt.getTime())
        ? getCurrentBsYear()
        : getCurrentBsYear(submittedAt);

      const finalYear = claim(survey.farmerId, inferred);
      if (finalYear !== inferred) {
        shifted += 1;
        log(
          `  farmer ${survey.farmerId} already has ${inferred} BS — ` +
            `survey ${survey._id} assigned ${finalYear} BS instead`
        );
      }

      survey.surveyYearBS = finalYear;
      assigned += 1;
    }

    const needsDerived = missingDerivedIds.has(String(survey._id));
    if (!needsYear && !needsDerived && !RECALCULATE_ALL) continue;

    // recalculateDerivedFields also bridges the legacy earnings fields.
    survey.recalculateDerivedFields();
    recalculated += 1;

    if (!DRY_RUN) {
      try {
        await survey.save({ validateBeforeSave: false });
      } catch (error) {
        failed += 1;
        console.error(`  FAILED ${survey._id}: ${error.message}`);
      }
    }
  }

  log('---');
  log(`census years assigned : ${assigned}`);
  log(`years shifted to avoid collisions: ${shifted}`);
  log(`derived fields recomputed : ${recalculated}`);
  if (failed) log(`failed to save : ${failed}`);
  if (DRY_RUN) log('DRY RUN — nothing was written. Re-run without --dry-run to apply.');

  // Build the new indexes now, while we can report a failure clearly, rather
  // than letting it fail quietly at server startup.
  if (!DRY_RUN) {
    try {
      await Survey.syncIndexes();
      log('indexes synced');
    } catch (error) {
      console.error(`index sync failed: ${error.message}`);
      console.error('Resolve duplicate { farmerId, surveyYearBS } pairs, then re-run.');
    }
  }

  await mongoose.disconnect();
  log('done');
};

run().catch(async (error) => {
  console.error(`[backfill] fatal: ${error.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
