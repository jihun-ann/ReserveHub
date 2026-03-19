import {Link} from 'react-router-dom'
import './TestHomeView.css'

export default function HomeView(){
    return(
        <section className="home" id='home-app'>
            <div className="hero">
                <p className="eyebrow">ReserveHub Draft Pages</p>
                <h2>역할별 화면 초안 진입</h2>
                <p className="subtitle">다운로드한 HTML 초안을 각 뷰 디렉토리에 연결했습니다. 아래에서 역할별 화면으로 이동할 수 있습니다.</p>
            </div>

            <div className="grid">
                <Link className="card" to="/user">
                    <strong>사용자</strong>
                    <span>마이페이지, 예약/이력 중심</span>
                </Link>
                <Link className="card" to="/tutor">
                    <strong>일반관리자</strong>
                    <span>강사/관리자 업무 화면</span>
                </Link>
                <Link className="card" to="/subsup">
                    <strong>서브슈퍼관리자</strong>
                    <span>플랫폼 운영 및 승인 흐름</span>
                </Link>
                <Link className="card" to="/super">
                    <strong>슈퍼관리자</strong>
                    <span>전체 플랫폼 통합 관리</span>
                </Link>
            </div>
        </section>
        )
}