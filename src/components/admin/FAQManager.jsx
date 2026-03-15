import { useState, useEffect } from "react";

const API = "http://localhost:5000/faqs";

/* ================= STYLES ================= */

const th = {
	padding: "14px",
	border: "1px solid #cfd8e3",
	fontWeight: "600",
	fontSize: "14px",
	textAlign: "center",
	background: "#0d47a1",
	color: "#fff"
};

const td = {
	padding: "12px",
	border: "1px solid #e0e6ef",
	fontSize: "13.5px",
	textAlign: "center",
	color: "#102a43",
	background: "#fff"
};

const btnPrimary = {
	padding: "8px 14px",
	background: "#0d47a1",
	color: "#fff",
	border: "none",
	borderRadius: "6px",
	cursor: "pointer"
};

const btnEdit = {
	padding: "7px 12px",
	background: "#f9a825",
	color: "#fff",
	border: "none",
	borderRadius: "6px",
	cursor: "pointer"
};

const btnDelete = {
	padding: "7px 12px",
	background: "#c62828",
	color: "#fff",
	border: "none",
	borderRadius: "6px",
	cursor: "pointer"
};

const backdrop = {
	position: "fixed",
	inset: 0,
	background: "rgba(0,0,0,0.45)",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	zIndex: 20
};

const modal = {
	background: "#0b0b0b",
	width: "520px",
	padding: "26px",
	borderRadius: "10px",
	display: "flex",
	flexDirection: "column",
	gap: "14px"
};

const label = {
	fontSize: "14px",
	fontWeight: "500",
	marginTop: "4px"
};

const input = {
	width: "100%",
	padding: "10px 12px",
	borderRadius: "6px",
	border: "1px solid #6c757d",
	fontSize: "14px",
	background: "#3a3a3a",
	color: "white",
	boxSizing: "border-box"
};

const textarea = {
	width: "100%",
	padding: "10px 12px",
	borderRadius: "6px",
	border: "1px solid #6c757d",
	fontSize: "14px",
	background: "#3a3a3a",
	color: "white",
	boxSizing: "border-box",
	height: "120px"
};

const buttonRow = {
	display: "flex",
	justifyContent: "flex-end",
	gap: "10px",
	marginTop: "10px"
};

/* ================= COMPONENT ================= */

export default function FAQManager() {

	const [faqs,setFaqs] = useState([]);
	const [question,setQuestion] = useState("");
	const [answer,setAnswer] = useState("");

	const [showModal,setShowModal] = useState(false);
	const [editingIndex,setEditingIndex] = useState(null);

	const loadFaqs = async () => {

		const res = await fetch(API);
		const data = await res.json();

		setFaqs(data);

	};

	useEffect(()=>{
		loadFaqs();
	},[]);


	const addFaq = async () => {

		await fetch(API,{
			method:"POST",
			headers:{
				"Content-Type":"application/json"
			},
			body:JSON.stringify({question,answer})
		});

		setQuestion("");
		setAnswer("");
		setShowModal(false);

		loadFaqs();

	};

	const updateFaq = async () => {

		await fetch(API+"/"+editingIndex,{
			method:"PUT",
			headers:{
				"Content-Type":"application/json"
			},
			body:JSON.stringify({question,answer})
		});

		setEditingIndex(null);
		setQuestion("");
		setAnswer("");
		setShowModal(false);

		loadFaqs();

	};

	const deleteFaq = async (index) => {

		await fetch(API+"/"+index,{
			method:"DELETE"
		});

		loadFaqs();

	};

	const openEdit = (faq,index)=>{
		setQuestion(faq.question);
		setAnswer(faq.answer);
		setEditingIndex(index);
		setShowModal(true);
	};

	const openAdd = ()=>{
		setEditingIndex(null);
		setQuestion("");
		setAnswer("");
		setShowModal(true);
	};

	return (

	<div>

		{/* ADD BUTTON */}
		<div style={{marginBottom:"15px"}}>
			<button style={btnPrimary} onClick={openAdd}>
				+ Add FAQ
			</button>
		</div>

		{/* TABLE */}

		<table
			style={{
				width:"100%",
				borderCollapse:"collapse",
				background:"#fff"
			}}
		>

		<thead>
		<tr>
			<th style={{...th,width:"35%"}}>Question</th>
			<th style={{...th,width:"45%"}}>Answer</th>
			<th style={{...th,width:"20%"}}>Action</th>
		</tr>
		</thead>

		<tbody>

		{faqs.length === 0 ? (

			<tr>
				<td colSpan="3" style={{padding:"18px",textAlign:"center"}}>
					No FAQs yet
				</td>
			</tr>

		) : (

			faqs.map((faq,index)=>(

			<tr key={index} style={{
				background:index % 2 === 0 ? "#ffffff" : "#eef3fb"
			}}>

				<td style={{...td,textAlign:"left"}}>
					{faq.question}
				</td>

				<td style={{...td,textAlign:"left"}}>
					{faq.answer}
				</td>

				<td style={td}>

					<div style={{display:"flex",gap:"8px",justifyContent:"center"}}>

						<button
							style={btnEdit}
							onClick={()=>openEdit(faq,index)}
						>
							Edit
						</button>

						<button
							style={btnDelete}
							onClick={()=>deleteFaq(index)}
						>
							Delete
						</button>

					</div>

				</td>

			</tr>

			))

		)}

		</tbody>

		</table>


		{/* MODAL */}

		{showModal && (

			<div style={backdrop}>

				<div style={modal}>

					<h3>{editingIndex === null ? "Add FAQ" : "Edit FAQ"}</h3>

                        <label style={label}>Question</label>
                        <input
                            style={input}
                            value={question}
                            onChange={(e)=>setQuestion(e.target.value)}
                        />

                        <label style={label}>Answer</label>
                        <textarea
                            style={textarea}
                            value={answer}
                            onChange={(e)=>setAnswer(e.target.value)}
                        />

                        <div style={buttonRow}>
                            <button
                                style={{...btnPrimary,background:"#6c757d"}}
                                onClick={()=>setShowModal(false)}
                            >
                                Cancel
                            </button>

                            <button
                                style={btnPrimary}
                                onClick={editingIndex === null ? addFaq : updateFaq}
                            >
                                {editingIndex === null ? "Add" : "Update"}
                            </button>
                        </div>

				</div>

			</div>

		)}

	</div>

	);

}