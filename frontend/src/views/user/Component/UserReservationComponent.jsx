export default function UserReservationComponent() {
	return (
		<div
			className={`program-card${selectedProg && selectedProg.id === p.id ? " selected" : ""}`}
			onClick={selectProgram("${p.id}")}
		>
			<div className="program-icon" style={{ background: "${p.bg}" }}>
				${p.icon}
			</div>
			<div className="program-body">
				<div className="program-name">${p.name}</div>
				<div className="program-meta">${p.meta}</div>
			</div>
			<span className="prog-badge ${p.badgeCls}">${p.badge}</span>
		</div>
	);
}
