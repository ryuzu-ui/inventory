import React, { useState } from "react";
import Header from "../components/layout/Header";
import BorrowTable from "../components/student/BorrowTable";
import { generateBorrowDoc } from "../components/services/docxGenerator";

export default function StudentPage() {
    const [products, setProducts] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [studentInfo, setStudentInfo] = useState({ name: "", labNo: "" });

    const handleSelect = (id, qty) => {
        setSelectedItems((prev) => {
            const exists = prev.find((i) => i.id === id);
            if (exists) return prev.map((i) => (i.id === id ? { ...i, qty } : i));
            return [...prev, { id, qty }];
        });
    };

    return (
        <div style={{ padding: "20px" }}>
            <Header title="Student Borrow Page" />
            <form style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
                <input type="text" placeholder="Student Name" value={studentInfo.name} onChange={(e) => setStudentInfo({ ...studentInfo, name: e.target.value })} required />
                <input type="text" placeholder="Laboratory No" value={studentInfo.labNo} onChange={(e) => setStudentInfo({ ...studentInfo, labNo: e.target.value })} required />
            </form>
            <BorrowTable products={products} onSelect={handleSelect} />
            <button style={{ marginTop: "20px" }} onClick={() => generateBorrowDoc(studentInfo, selectedItems, products)}>
                Generate Borrow Form
            </button>
        </div>
    );
}
