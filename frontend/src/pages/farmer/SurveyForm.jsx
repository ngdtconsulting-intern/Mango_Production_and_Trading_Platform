import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import '../../styles/forms.css';

const EDUCATION_LEVELS = ['None', 'Primary', 'Secondary', 'Higher Secondary', 'Bachelor', 'Master or above'];
const TREE_AGE_RANGES = ['1-3', '4-5', '6-10', '11-15', '16-25', '26-40', '40+'];

export default function SurveyForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Personal
    farmerName: '',
    phone: '',
    age: '',
    educationLevel: EDUCATION_LEVELS[0],

    // Address
    wardNumber: '',
    tole: '',

    // Household
    householdMembers: '',

    // Orchard
    orchardAreaKatha: '',
    totalMangoTrees: '',

    // Management
    selfManaged: true,
    managementType: '',
    productionCostNPR: '',

    // Production
    totalProductionKg: '',
    totalEarnings2082: '',
    totalEarnings2081: '',

    // Satisfaction
    satisfactionLevel: 5,

    // Assistance
    receivedGovernmentAssistance: false,
    governmentOfficeSource: '',
    receivedNonGovernmentAssistance: false,
    nonGovernmentSource: '',

    // Challenges
    productionChallenges: '',
    marketingChallenges: '',
    suggestions: '',
  });

  const [treeAges, setTreeAges] = useState(
    TREE_AGE_RANGES.reduce((acc, range) => ({ ...acc, [range]: '' }), {})
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleTreeAgeChange = (range, value) => {
    setTreeAges({ ...treeAges, [range]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const treeAgeDistribution = TREE_AGE_RANGES
      .filter((range) => treeAges[range] !== '')
      .map((range) => ({ ageRange: range, numberOfTrees: Number(treeAges[range]) }));

    try {
      await api.post('/surveys', {
        ...formData,
        age: Number(formData.age),
        wardNumber: Number(formData.wardNumber),
        householdMembers: Number(formData.householdMembers),
        orchardAreaKatha: Number(formData.orchardAreaKatha),
        totalMangoTrees: Number(formData.totalMangoTrees),
        productionCostNPR: formData.productionCostNPR ? Number(formData.productionCostNPR) : undefined,
        totalProductionKg: formData.totalProductionKg ? Number(formData.totalProductionKg) : 0,
        totalEarnings2082: formData.totalEarnings2082 ? Number(formData.totalEarnings2082) : 0,
        totalEarnings2081: formData.totalEarnings2081 ? Number(formData.totalEarnings2081) : 0,
        satisfactionLevel: Number(formData.satisfactionLevel),
        treeAgeDistribution,
      });
      toast.success('Survey submitted successfully');
      navigate('/farmer/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit survey');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h1>Farm Survey</h1>
      <form onSubmit={handleSubmit}>

        <h3 className="form-section">Your Details</h3>
        <div className="form-grid">
          <div>
            <label>Full Name</label>
            <input type="text" name="farmerName" value={formData.farmerName} onChange={handleChange} required />
          </div>
          <div>
            <label>Phone</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} pattern="[0-9]{10}" required />
          </div>
          <div>
            <label>Age</label>
            <input type="number" name="age" min="18" max="100" value={formData.age} onChange={handleChange} required />
          </div>
          <div>
            <label>Education Level</label>
            <select name="educationLevel" value={formData.educationLevel} onChange={handleChange}>
              {EDUCATION_LEVELS.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
            </select>
          </div>
        </div>

        <h3 className="form-section">Address</h3>
        <div className="form-grid">
          <div>
            <label>Ward Number</label>
            <input type="number" name="wardNumber" min="1" value={formData.wardNumber} onChange={handleChange} required />
          </div>
          <div>
            <label>Tole</label>
            <input type="text" name="tole" value={formData.tole} onChange={handleChange} required />
          </div>
        </div>

        <h3 className="form-section">Household & Orchard</h3>
        <div className="form-grid">
          <div>
            <label>Household Members</label>
            <input type="number" name="householdMembers" min="1" value={formData.householdMembers} onChange={handleChange} required />
          </div>
          <div>
            <label>Orchard Area (katha)</label>
            <input type="number" step="0.1" name="orchardAreaKatha" min="0.1" value={formData.orchardAreaKatha} onChange={handleChange} required />
          </div>
          <div>
            <label>Total Mango Trees</label>
            <input type="number" name="totalMangoTrees" min="1" value={formData.totalMangoTrees} onChange={handleChange} required />
          </div>
        </div>

        <h3 className="form-section">Tree Age Distribution (optional)</h3>
        <div className="tree-age-grid">
          {TREE_AGE_RANGES.map((range) => (
            <div key={range}>
              <label>{range} yrs</label>
              <input
                type="number"
                min="0"
                value={treeAges[range]}
                onChange={(e) => handleTreeAgeChange(range, e.target.value)}
              />
            </div>
          ))}
        </div>

        <h3 className="form-section">Management</h3>
        <div className="form-grid">
          <div>
            <label>
              <input
                type="checkbox"
                name="selfManaged"
                checked={formData.selfManaged}
                onChange={handleChange}
                style={{ width: 'auto', marginRight: 8 }}
              />
              Self-managed
            </label>
          </div>
          <div>
            <label>Production Cost (NPR, optional)</label>
            <input type="number" name="productionCostNPR" value={formData.productionCostNPR} onChange={handleChange} />
          </div>
        </div>

        <h3 className="form-section">Production & Earnings (optional)</h3>
        <div className="form-grid">
          <div>
            <label>Total Production (kg)</label>
            <input type="number" name="totalProductionKg" value={formData.totalProductionKg} onChange={handleChange} />
          </div>
          <div>
            <label>Earnings this year (2082, NPR)</label>
            <input type="number" name="totalEarnings2082" value={formData.totalEarnings2082} onChange={handleChange} />
          </div>
          <div>
            <label>Earnings last year (2081, NPR)</label>
            <input type="number" name="totalEarnings2081" value={formData.totalEarnings2081} onChange={handleChange} />
          </div>
        </div>

        <h3 className="form-section">Satisfaction</h3>
        <label>How satisfied are you with mango farming? (0 = not at all, 10 = extremely)</label>
        <input type="range" name="satisfactionLevel" min="0" max="10" value={formData.satisfactionLevel} onChange={handleChange} />
        <p style={{ fontFamily: 'var(--font-mono)', marginTop: 4 }}>{formData.satisfactionLevel} / 10</p>

        <h3 className="form-section">Assistance Received</h3>
        <div className="form-grid">
          <div>
            <label>
              <input
                type="checkbox"
                name="receivedGovernmentAssistance"
                checked={formData.receivedGovernmentAssistance}
                onChange={handleChange}
                style={{ width: 'auto', marginRight: 8 }}
              />
              Received government assistance
            </label>
            {formData.receivedGovernmentAssistance && (
              <input
                type="text"
                name="governmentOfficeSource"
                placeholder="Which office?"
                value={formData.governmentOfficeSource}
                onChange={handleChange}
                style={{ marginTop: 8 }}
              />
            )}
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                name="receivedNonGovernmentAssistance"
                checked={formData.receivedNonGovernmentAssistance}
                onChange={handleChange}
                style={{ width: 'auto', marginRight: 8 }}
              />
              Received NGO/other assistance
            </label>
            {formData.receivedNonGovernmentAssistance && (
              <input
                type="text"
                name="nonGovernmentSource"
                placeholder="Which organization?"
                value={formData.nonGovernmentSource}
                onChange={handleChange}
                style={{ marginTop: 8 }}
              />
            )}
          </div>
        </div>

        <h3 className="form-section">Challenges & Suggestions (optional)</h3>
        <label>Production challenges</label>
        <textarea rows="3" name="productionChallenges" value={formData.productionChallenges} onChange={handleChange} />

        <label>Marketing challenges</label>
        <textarea rows="3" name="marketingChallenges" value={formData.marketingChallenges} onChange={handleChange} />

        <label>Suggestions for improvement</label>
        <textarea rows="3" name="suggestions" value={formData.suggestions} onChange={handleChange} />

        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Survey'}
        </button>
      </form>
    </div>
  );
}