import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useNavigate } from "react-router-dom";

const COLOURS = ["red", "green", "turquoise", "blue"]; //could probably do with a colour re-work (actual hex). this makes things very ugly

//defined exact data as expected from backend endpoint...
type DashboardData = {
    healthScore: number;
    takeHome: number;
    budgetLeft: number;
    totalBudget: number;
    actualSpending: { name: string; value: number }[];
    budgetAllocation: { name: string; value: number }[];
};

const Dashboard = () => {
    const navigate = useNavigate();
    //react state which stores dadhboard data, intially null
    const [data, setData] = useState<DashboardData | null>(null);

    //useEffect runs once - triggers loading data from backens
    useEffect(() => {
        //fetchDashboard responsible for fetching dashboard data from abckend
        const fetchDashboard = async () => {
            try {
                const {token} = useAuth();
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/v1/dashboard`,
                    { headers: { Authorization: `Bearer ${token}` } });
                setData(res.data); //store returned data
            } catch (error) {
                //catch is used for testing at the moment, because I do not know how to access Mongo
                console.log("Error when fetching dashboard:", error);
                //this next setData can be removed as well, as it is just test data...
            }
        };
        //immediately execute fetch when the component loads
        fetchDashboard();
    }, []);
    if (!data) return <div>Loading...</div>; //whi;e request is still running,

    return (
        <div style={{maxWidth: "1000px", margin: "30px auto", fontFamily: "Arial, sans-serif"}}>
            {/* simple navbar with navigation buttons */}
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "20px", padding: "10px 0", borderBottom: "1px solid #ccc"}}>
                <h2>Dashboard</h2>
                <div style={{ display: "flex", gap: "10px" }}>
                    {/* redirects user to profile page */}
                    <button onClick={() => navigate("/profile")}>
                        Profile
                    </button>
                    {/* redirects user to quiz page */}
                    <button onClick={() => navigate("/quiz")}>
                        Quiz
                    </button>
                    {/* redirects to expense - may need to be renamed*/}
                    <button onClick={() => navigate("/expenses")}>
                        Log Expense
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
                <h3>Take-home: £{data.takeHome} | Budget: £{data.totalBudget}</h3>
            </div>

            <div style={{ display: "flex", gap: "40px", marginBottom: "40px" }}>
                <div>
                    <h4>Budget Allocation</h4>
                    <PieChart width={300} height={220}>
                        <Pie
                            data={data.budgetAllocation || []} //fallback to empty array prevents runtime
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                        >
                            {/* different colours for each slice*/}
                            {(data.budgetAllocation || []).map((_, index) => (
                                <Cell key={index} fill={COLOURS[index % COLOURS.length]} />
                            ))}
                        </Pie>
                        {/*tooltps and labels allow cool breakdowns when hoevering*/}
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </div>

                <div>
                    <h4>Actual Spending</h4>
                    <PieChart width={300} height={220}>
                        <Pie
                            data={data.actualSpending || []}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                        >
                            {(data.actualSpending || []).map((_, index) => (
                                <Cell key={index} fill={COLOURS[index % COLOURS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </div>
            </div>

            <div style={{ display: "flex", gap: "60px" }}>
                <p style={{fontSize: "28px", fontWeight: "bold",
                    color:
                        data.healthScore < 40 ? "red" :
                        data.healthScore < 70 ? "orange" :
                        "green"
                }}>
                    {data.healthScore}
                </p>

                <div>
                    <h4>Take Home</h4>
                    <p style={{ fontSize: "20px" }}>£{data.takeHome}</p>
                </div>

                <div>
                    <h4>Budget Left</h4>
                    <p style={{ fontSize: "20px" }}>£{data.budgetLeft}</p>
                </div>

                <div>
                    <h4>Budget vs Actual</h4>
                    {data.budgetLeft >= 0 ? (
                        <p>
                            Under budget by £{data.budgetLeft}
                        </p>
                    ) : (
                        <p>
                            {/*abs ensures displayed numebr is positive wen showing overbudget*/}
                            Over budget by £{Math.abs(data.budgetLeft)}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
export default Dashboard;