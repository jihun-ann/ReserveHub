import ManagerAdminPanel from "../../components/ManagerAdminPanel.jsx";

// 매니저 그룹에 '매니저 초대/삭제, 그룹 관리'(MANAGER_MANAGE) 권한이 있을 때 사이드바에 나오는 화면.
export default function ManagerManagerManageView({ platformId }) {
	return (
		<div className="page" id="manager-manager-manage">
			<div className="page-header">
				<div className="page-title">매니저 관리</div>
				<div className="page-subtitle">매니저 초대와 그룹별 메뉴·기능 권한</div>
			</div>
			{platformId ? <ManagerAdminPanel key={platformId} platformId={platformId} /> : null}
		</div>
	);
}
