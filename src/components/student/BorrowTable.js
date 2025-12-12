import React, { useState } from "react";

export default function BorrowTable({ products, onSelect }) {
    const [borrowQty, setBorrowQty] = useState({});

    const handleQtyChange = (id, value) => {
        setBorrowQty({ ...borrowQty, [id]: Math.min(value, products.find((p) => p.id === id).qty + products.find((p) => p.id === id).additionalQty) });
    };

    return (
        <table border="1" cellPadding="5" cellSpacing="0" style={{ width: "100%" }}>
            <thead>
                <tr>
                    <th>No.</th>
                    <th>Description (Item)</th>
                    <th>Available</th>
                    <th>Borrow Qty</th>
                </tr>
            </thead>
            <tbody>
                {products.map((product, index) => (
                    <tr key={product.id}>
                        <td>{index + 1}</td>
                        <td>{product.name}</td>
                        <td>{product.qty + product.additionalQty}</td>
                        <td>
                            <input
                                type="number"
                                min="0"
                                max={product.qty + product.additionalQty}
                                value={borrowQty[product.id] || ""}
                                onChange={(e) => {
                                    handleQtyChange(product.id, parseInt(e.target.value));
                                    onSelect(product.id, parseInt(e.target.value));
                                }}
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
