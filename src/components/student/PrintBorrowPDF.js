export function PrintBorrowPDF({ name, labNo, controlNo, items }) {
	const TOTAL_ROWS = 30;

	const rows = Array.from({ length: TOTAL_ROWS }).map((_, i) => {
		const item = items?.[i];
		return `
			<tr>
				<td>${i + 1}</td>
				<td>${item ? item.tools : ""}</td>
				<td>${item ? item.qty : ""}</td>
				<td></td>
				<td></td>
				<td></td>
				<td></td>
			</tr>
		`;
	}).join("");

	const html = `
<!DOCTYPE html>
<html>
<head>
	<title>Borrow Form</title>
	<style>
		@page {
			size: A4;
			margin: 15mm;
		}

		body {
			font-family: Arial, sans-serif;
			font-size: 11px;
			color: #000;
		}

		/* ===== HEADER ===== */
		.top-header {
			display: grid;
			grid-template-columns: 1fr 1fr 1fr;
			align-items: center;
			margin-bottom: 8px;
		}

		.top-header .left {
			text-align: left;
		}

		.top-header .center {
			text-align: center;
			font-weight: bold;
			font-size: 14px;
		}

		.top-header .right {
			text-align: right;
			font-weight: bold;
		}

		.sub-header {
			display: flex;
			justify-content: space-between;
			margin-bottom: 8px;
		}

		/* ===== TABLE ===== */
		table {
			width: 100%;
			border-collapse: collapse;
		}

		th, td {
			border: 1px solid #000;
			padding: 4px;
			text-align: center;
			height: 18px;
		}

		th {
			font-weight: bold;
		}

		td:nth-child(2) {
			text-align: left;
		}
	</style>
</head>

<body onload="window.print(); window.close();">

	<!-- HEADER -->
	<div class="top-header">
		<div class="left">
			${new Date().toLocaleString()}
		</div>

		<div class="center">
			Borrow Form
		</div>

		<div class="right">
			Control No: ${controlNo}
		</div>
	</div>

	<div class="sub-header">
		<div><b>Name:</b> ${name}</div>
		<div><b>Lab No:</b> ${labNo}</div>
	</div>

	<!-- TABLE -->
	<table>
		<thead>
			<tr>
				<th style="width:5%">No</th>
				<th style="width:35%">Description</th>
				<th style="width:7%">Qty</th>
				<th style="width:10%">Released</th>
				<th style="width:10%">Returned</th>
				<th style="width:10%">Unreturned</th>
				<th style="width:13%">Remarks</th>
			</tr>
		</thead>
		<tbody>
			${rows}
		</tbody>
	</table>

</body>
</html>
`;

	const win = window.open("", "_blank");
	win.document.open();
	win.document.write(html);
	win.document.close();
}
