import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

console.log('TopicPieChart component loaded');

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const TopicPieChart = ({ topicCounts }) => {
  console.log('TopicPieChart rendering with topicCounts:',topicCounts);
  const data = useMemo(() => 
    Object.entries(topicCounts).map(([name, value]) => ({ name, value })),
    [topicCounts]
  );
  if (Object.keys(topicCounts).length === 0) {
    return <div>No data available for the pie chart</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default TopicPieChart;