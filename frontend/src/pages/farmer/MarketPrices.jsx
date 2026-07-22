import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import '../../styles/market.css';

export default function MarketPrices() {
  const [prices, setPrices] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState('Kalimati');
  const [selectedVariety, setSelectedVariety] = useState('Maldaha');
  const [loading, setLoading] = useState(true);

  const MARKETS = ['Kalimati', 'Balkhu', 'Lahan', 'Janakpur', 'Hetauda', 'Bhaktapur'];
  const VARIETIES = ['Maldaha', 'Amrapali', 'Sindhure', 'Langra', 'Dusehri', 'Chaunsa'];

  useEffect(() => {
    fetchPrices();
  }, [selectedMarket, selectedVariety]);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/market/latest', {
        params: { market: selectedMarket, variety: selectedVariety },
      });
      setPrices(response.data.data);

      const trendResponse = await api.get('/market/trends', {
        params: { market: selectedMarket, variety: selectedVariety, days: 30 },
      });
      setPriceHistory(trendResponse.data.data.priceData);
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="market-container">
      <div className="market-header">
        <h1>📊 Market Prices</h1>
        <p>Current mango prices across major markets</p>
      </div>

      <div className="market-filters">
        <div className="filter-group">
          <label>Market:</label>
          <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)}>
            {MARKETS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Variety:</label>
          <select value={selectedVariety} onChange={(e) => setSelectedVariety(e.target.value)}>
            {VARIETIES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="loading">Loading prices...</p>
      ) : (
        <>
          {/* Price Cards */}
          <div className="price-cards">
            {prices.map((price) => (
              <div key={`${price.market}-${price.variety}`} className="price-card">
                <h3>{price.market}</h3>
                <div className="price-info">
                  <div className="price-row">
                    <span>Wholesale:</span>
                    <strong>Rs. {price.wholesalePricePerKg}/kg</strong>
                  </div>
                  <div className="price-row">
                    <span>Retail:</span>
                    <strong>Rs. {price.retailPricePerKg}/kg</strong>
                  </div>
                  <div className="price-row">
                    <span>Average:</span>
                    <strong>Rs. {price.avgPrice?.toFixed(2)}/kg</strong>
                  </div>
                </div>
                <div className="supply-info">
                  <span className={`supply-badge ${price.supply}`}>{price.supply.toUpperCase()}</span>
                  <span className={`quality-badge ${price.quality}`}>{price.quality}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Price Trend Chart */}
          <div className="chart-section">
            <h2>30-Day Price Trend</h2>
            {priceHistory.length > 0 && (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value) => `Rs. ${value.toFixed(2)}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="wholesale" stroke="#8884d8" name="Wholesale Price" />
                  <Line type="monotone" dataKey="retail" stroke="#82ca9d" name="Retail Price" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}