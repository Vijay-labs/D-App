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
    const [overallProgress, setOverallProgress] = useState({ labels: [], dataset: [] });
    const [weeklyProgress, setWeeklyProgress] = useState({ labels: [], dataset: [] });
    const [compareProgress, setCompareProgress] = useState({ labels: [], dataset: [] });
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [compareCategory, setCompareCategory] = useState('');

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
                processOverallProgress(parsedData);
                extractCategories(parsedData);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const processOverallProgress = (data) => {
        const progressData = {};
        data.forEach(row => {
            const { quiz_date, correctness } = row;
            if (!progressData[quiz_date]) {
                progressData[quiz_date] = { correct: 0, total: 0 };
            }
            progressData[quiz_date].correct += Number(correctness);
            progressData[quiz_date].total += 1;
        });

        const labels = Object.keys(progressData);
        const dataset = labels.map(date => (progressData[date].correct / progressData[date].total) * 100);
        setOverallProgress({ labels, dataset });
    };

    const extractCategories = (data) => {
        const categoriesSet = new Set();
        data.forEach(row => {
            categoriesSet.add(row.category);
        });
        setCategories(Array.from(categoriesSet));
    };

    const processWeeklyProgress = (category) => {
        const progressData = {};
        data.forEach(row => {
            if (row.category === category) {
                const { quiz_date, correctness } = row;
                if (!progressData[quiz_date]) {
                    progressData[quiz_date] = { correct: 0, total: 0 };
                }
                progressData[quiz_date].correct += Number(correctness);
                progressData[quiz_date].total += 1;
            }
        });

        const labels = Object.keys(progressData);
        const dataset = labels.map(date => (progressData[date].correct / progressData[date].total) * 100);
        setWeeklyProgress({ labels, dataset });
    };

    const handleCategoryChange = (e) => {
        const category = e.target.value;
        setSelectedCategory(category);
        processWeeklyProgress(category);
    };

    const handleCompareCategoryChange = (e) => {
        setCompareCategory(e.target.value);
    };

    const handleCompare = () => {
        if (compareCategory) {
            const progressData = {};
            data.forEach(row => {
                if (row.category === compareCategory) {
                    const { quiz_date, correctness } = row;
                    if (!progressData[quiz_date]) {
                        progressData[quiz_date] = { correct: 0, total: 0 };
                    }
                    progressData[quiz_date].correct += Number(correctness);
                    progressData[quiz_date].total += 1;
                }
            });

            const labels = Object.keys(progressData);
            const dataset = labels.map(date => (progressData[date].correct / progressData[date].total) * 100);
            setCompareProgress({ labels, dataset });
        }
    };

    return (
        <div>
            <h1>Quiz Performance Graph</h1>
            <div>
                <h2>Overall Progress</h2>
                <Line
                    data={{
                        labels: overallProgress.labels,
                        datasets: [{
                            label: 'Overall Correctness (%)',
                            data: overallProgress.dataset,
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1,
                        }],
                    }}
                    options={{
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Date',
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
            <div>
                <h2>Weekly Progress</h2>
                <div>
                    <label>
                        Select Category:
                        <select value={selectedCategory} onChange={handleCategoryChange}>
                            <option value="">--Select--</option>
                            {categories.map(category => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                {selectedCategory && (
                    <Line
                        data={{
                            labels: weeklyProgress.labels,
                            datasets: [{
                                label: `${selectedCategory} Weekly Correctness (%)`,
                                data: weeklyProgress.dataset,
                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                borderColor: 'rgba(75, 192, 192, 1)',
                                borderWidth: 1,
                            }],
                        }}
                        options={{
                            scales: {
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Date',
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
                )}
            </div>
            <div>
                <h2>Compare Weekly Progress</h2>
                <div>
                    <label>
                        Compare with Category:
                        <select value={compareCategory} onChange={handleCompareCategoryChange}>
                            <option value="">--Select--</option>
                            {categories.map(category => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button onClick={handleCompare}>Compare</button>
                </div>
                {compareCategory && (
                    <Line
                        data={{
                            labels: compareProgress.labels,
                            datasets: [{
                                label: `${selectedCategory} Weekly Correctness (%)`,
                                data: weeklyProgress.dataset,
                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                borderColor: 'rgba(75, 192, 192, 1)',
                                borderWidth: 1,
                            }, {
                                label: `${compareCategory} Weekly Correctness (%)`,
                                data: compareProgress.dataset,
                                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                borderColor: 'rgba(255, 99, 132, 1)',
                                borderWidth: 1,
                            }],
                        }}
                        options={{
                            scales: {
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Date',
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
                )}
            </div>
        </div>
    );
};

export default QuizGraph;
