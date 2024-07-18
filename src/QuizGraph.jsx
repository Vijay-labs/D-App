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
        const csvFilePath = '/quiz-results.csv'; // Path to your CSV file in public folder

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

    const processData = (data) => {
        const overallImprovementData = {};
        data.forEach(row => {
            const { correctness, quiz_date } = row;
            if (!overallImprovementData[quiz_date]) {
                overallImprovementData[quiz_date] = { correct: 0, total: 0 };
            }
            overallImprovementData[quiz_date].correct += correctness === 'true' ? 1 : 0;
            overallImprovementData[quiz_date].total++;
        });

        const overallLabels = Object.keys(overallImprovementData).sort((a, b) => new Date(a) - new Date(b));
        const overallDataset = overallLabels.map(date => (overallImprovementData[date].correct / overallImprovementData[date].total) * 100);

        return { overallLabels, overallDataset };
    };

    const processCategoryData = (data) => {
        const categoryData = {};
        data.forEach(row => {
            const { correctness, quiz_date, category } = row;
            const week = getWeekFromDate(new Date(quiz_date));
            if (!categoryData[category]) {
                categoryData[category] = {};
            }
            if (!categoryData[category][week]) {
                categoryData[category][week] = { correct: 0, total: 0 };
            }
            categoryData[category][week].correct += correctness === 'true' ? 1 : 0;
            categoryData[category][week].total++;
        });

        setWeeklyCategory(categoryData);
    };

    const getWeekFromDate = (date) => {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - startOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    };

    const handleCategoryChange = (event) => {
        setSelectedCategory(event.target.value);
    };

    const handleCompareChange = (event) => {
        setCompareCategory(event.target.value);
    };

    const handleCompare = () => {
        if (weeklyCategory[selectedCategory] && weeklyCategory[compareCategory]) {
            setCompareData({
                selectedCategory: weeklyCategory[selectedCategory],
                compareCategory: weeklyCategory[compareCategory]
            });
        }
    };

    const generateChartData = (categoryData) => {
        const labels = Object.keys(categoryData).sort();
        const dataset = labels.map(week => (categoryData[week].correct / categoryData[week].total) * 100);

        return { labels, dataset };
    };

    const overallData = processData(data);
    const selectedCategoryData = generateChartData(weeklyCategory[selectedCategory] || {});
    const compareCategoryData = generateChartData(weeklyCategory[compareCategory] || {});

    return (
        <div>
            <h1>Quiz Results</h1>
            <div>
                <Line
                    data={{
                        labels: overallData.overallLabels,
                        datasets: [{
                            label: 'Overall Improvement Over Time',
                            data: overallData.overallDataset,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: true,
                        }]
                    }}
                    options={{
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Date'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Correctness (%)'
                                },
                                min: 0,
                                max: 100
                            }
                        }
                    }}
                />
            </div>
            <div>
                <h2>Weekly Improvement by Category</h2>
                <Bar
                    data={{
                        labels: selectedCategoryData.labels,
                        datasets: [{
                            label: `${selectedCategory} Improvement`,
                            data: selectedCategoryData.dataset,
                            backgroundColor: selectedCategoryData.dataset.map(value => {
                                if (value > 60) return 'rgba(75, 192, 192, 0.2)';
                                if (value >= 35) return 'rgba(255, 165, 0, 0.2)';
                                return 'rgba(255, 99, 132, 0.2)';
                            }),
                            borderColor: selectedCategoryData.dataset.map(value => {
                                if (value > 60) return 'rgba(75, 192, 192, 1)';
                                if (value >= 35) return 'rgba(255, 165, 0, 1)';
                                return 'rgba(255, 99, 132, 1)';
                            }),
                            borderWidth: 1
                        }]
                    }}
                    options={{
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Week'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Correctness (%)'
                                },
                                min: 0,
                                max: 100
                            }
                        }
                    }}
                />
            </div>
            <div>
                <h2>Compare Weekly Improvement</h2>
                <div>
                    <label>
                        Select Category:
                        <select value={selectedCategory} onChange={handleCategoryChange}>
                            <option value="">--Select--</option>
                            {Object.keys(weeklyCategory).map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Compare With:
                        <select value={compareCategory} onChange={handleCompareChange}>
                            <option value="">--Select--</option>
                            {Object.keys(weeklyCategory).map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </label>
                    <button onClick={handleCompare}>Compare</button>
                </div>
                {compareData && (
                    <div>
                        <Bar
                            data={{
                                labels: selectedCategoryData.labels,
                                datasets: [
                                    {
                                        label: `${selectedCategory} Improvement`,
                                        data: selectedCategoryData.dataset,
                                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                        borderColor: 'rgba(75, 192, 192, 1)',
                                        borderWidth: 1
                                    },
                                    {
                                        label: `${compareCategory} Improvement`,
                                        data: compareCategoryData.dataset,
                                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                        borderColor: 'rgba(255, 99, 132, 1)',
                                        borderWidth: 1
                                    }
                                ]
                            }}
                            options={{
                                scales: {
                                    x: {
                                        title: {
                                            display: true,
                                            text: 'Week'
                                        }
                                    },
                                    y: {
                                        title: {
                                            display: true,
                                            text: 'Correctness (%)'
                                        },
                                        min: 0,
                                        max: 100
                                    }
                                }
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizGraph;
