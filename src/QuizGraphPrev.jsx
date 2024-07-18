import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register the necessary components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const QuizGraph = () => {
    const [data, setData] = useState([]);
    const [weeklyCategory, setWeeklyCategory] = useState({});
    const [selectedCategory, setSelectedCategory] = useState('');
    const [compareCategory, setCompareCategory] = useState('');
    const [compareData, setCompareData] = useState(null);

    useEffect(() => {
        const csvFilePath = './quiz-results.csv'; // Path to your CSV file in the public folder

        const fetchData = async () => {
            try {
                const response = await fetch(csvFilePath);
                const reader = response.body.getReader();
                const result = await reader.read();
                const decoder = new TextDecoder('utf-8');
                const csvData = decoder.decode(result.value);

                // Parse CSV data
                const parsedData = Papa.parse(csvData, { header: true }).data;
                console.log('Parsed CSV Data:', parsedData);
                setData(parsedData);
                processCategoryData(parsedData);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const processCategoryData = (data) => {
        const categoryData = {};

        data.forEach(row => {
            const { category, correctness, quiz_date } = row;

            if (!categoryData[category]) {
                categoryData[category] = {};
            }

            if (!categoryData[category][quiz_date]) {
                categoryData[category][quiz_date] = { correct: 0, total: 0 };
            }

            categoryData[category][quiz_date].correct += Number(correctness);
            categoryData[category][quiz_date].total += 1;
        });

        setWeeklyCategory(categoryData);
    };

    const getCategoryImprovementData = (category) => {
        const categoryData = weeklyCategory[category];
        const labels = [];
        const dataset = [];

        if (categoryData) {
            Object.keys(categoryData).forEach(date => {
                labels.push(date);
                const dataPoint = (categoryData[date].correct / categoryData[date].total) * 100;
                dataset.push(dataPoint);
            });
        }

        return { labels, dataset };
    };

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
    };

    const handleCompareCategoryChange = (e) => {
        setCompareCategory(e.target.value);
    };

    const selectedCategoryData = getCategoryImprovementData(selectedCategory);
    const compareCategoryData = getCategoryImprovementData(compareCategory);

    return (
        <div>
            <h1>Quiz Performance Graph</h1>
            <div>
                <label>
                    Select Category:
                    <select value={selectedCategory} onChange={handleCategoryChange}>
                        <option value="">--Select--</option>
                        {Object.keys(weeklyCategory).map(category => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <div>
                <label>
                    Compare with Category:
                    <select value={compareCategory} onChange={handleCompareCategoryChange}>
                        <option value="">--Select--</option>
                        {Object.keys(weeklyCategory).map(category => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <div>
                {selectedCategory && (
                    <div>
                        <h2>{selectedCategory} Improvement</h2>
                        <Line
                            data={{
                                labels: selectedCategoryData.labels,
                                datasets: [
                                    {
                                        label: `${selectedCategory} Improvement`,
                                        data: selectedCategoryData.dataset,
                                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                        borderColor: 'rgba(75, 192, 192, 1)',
                                        borderWidth: 1,
                                    },
                                    compareCategory && {
                                        label: `${compareCategory} Improvement`,
                                        data: compareCategoryData.dataset,
                                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                        borderColor: 'rgba(255, 99, 132, 1)',
                                        borderWidth: 1,
                                    },
                                ].filter(Boolean),
                            }}
                            options={{
                                scales: {
                                    x: {
                                        title: {
                                            display: true,
                                            text: 'Week',
                                        },
                                    },
                                    y: {
                                        title: {
                                            display: true,
                                            text: 'Correctness (%)',
                                        },
                                        min: 0,
                                        max: 100,
                                    },
                                },
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizGraph;
