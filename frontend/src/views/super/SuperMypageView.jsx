export default function SuperMypageView(){
    return (<div className="page" id="super-mypage">
        {/* ══════════════ 마이페이지 ══════════════ */}
        <div className="page-header">
            <div className="page-label">MY PAGE</div>
            <div className="page-title">내 정보</div>
            <div className="page-subtitle">계정 정보와 담당 플랫폼 현황을 확인하세요</div>
        </div>

        <div className="hero">
            <div className="hero-avatar">정</div>
            <div className="hero-info">
                <div className="hero-name">정미래 점장</div>
                <div className="hero-email">jung.mirae@reservehub.kr · 010-9999-1234</div>
            </div>
            <div className="hero-stats">
                <div className="hstat">
                    <div className="hstat-val">2</div>
                    <div className="hstat-key">담당 플랫폼</div>
                </div>
                <div className="hstat">
                    <div className="hstat-val" style="color:var(--green)">228</div>
                    <div className="hstat-key">전체 회원</div>
                </div>
                <div className="hstat">
                    <div className="hstat-val" style="color:var(--accent3)">6</div>
                    <div className="hstat-key">소속 강사</div>
                </div>
                <div className="hstat">
                    <div className="hstat-val" style="color:var(--green)">15만</div>
                    <div className="hstat-key">이번달 매출</div>
                </div>
            </div>
            <button className="btn btn-ghost btn-sm">✏️ 정보 수정</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
            <div className="card">
                <div className="card-title">담당 플랫폼</div>
                <div style="display:flex;flex-direction:column;gap:0">
                    <div
                        style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--border)">
                        <div
                            style="width:38px;height:38px;border-radius:10px;background:rgba(124,106,247,.12);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">🤸
                        </div>
                        <div style="flex:1">
                            <div style="font-size:14px;font-weight:600">스튜디오 필라테스 강남</div>
                            <div style="font-size:11px;color:var(--text-sub);margin-top:3px">회원 142명 ·
                                강사 4명
                                · 매출 9.8만
                            </div>
                        </div>
                        <span className="badge bs-active" style="font-size:10px">담당 중</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px;padding:14px 0">
                        <div
                            style="width:38px;height:38px;border-radius:10px;background:rgba(79,209,197,.12);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">🧘
                        </div>
                        <div style="flex:1">
                            <div style="font-size:14px;font-weight:600">요가라운지 홍대</div>
                            <div style="font-size:11px;color:var(--text-sub);margin-top:3px">회원 86명 · 강사
                                2명
                                · 매출 5.2만
                            </div>
                        </div>
                        <span className="badge bs-active" style="font-size:10px">담당 중</span>
                    </div>
                </div>
            </div>
            <div className="card">
                <div className="card-title">이번달 처리 이력</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                    <div
                        style="background:var(--surface2);border-radius:var(--rs);padding:14px;text-align:center">
                        <div style="font-family:'DM Mono',monospace;font-size:22px;color:var(--green)">8
                        </div>
                        <div style="font-size:10px;color:var(--text-dim);margin-top:3px">승인 처리</div>
                    </div>
                    <div
                        style="background:var(--surface2);border-radius:var(--rs);padding:14px;text-align:center">
                        <div style="font-family:'DM Mono',monospace;font-size:22px;color:var(--red)">2
                        </div>
                        <div style="font-size:10px;color:var(--text-dim);margin-top:3px">반려 처리</div>
                    </div>
                    <div
                        style="background:var(--surface2);border-radius:var(--rs);padding:14px;text-align:center">
                        <div
                            style="font-family:'DM Mono',monospace;font-size:22px;color:var(--accent)">5
                        </div>
                        <div style="font-size:10px;color:var(--text-dim);margin-top:3px">상담 기록</div>
                    </div>
                    <div
                        style="background:var(--surface2);border-radius:var(--rs);padding:14px;text-align:center">
                        <div
                            style="font-family:'DM Mono',monospace;font-size:22px;color:var(--accent3)">3
                        </div>
                        <div style="font-size:10px;color:var(--text-dim);margin-top:3px">회원 등록</div>
                    </div>
                </div>
            </div>
            <div className="card">
                <div className="card-title">계정 정보</div>
                <div style="display:flex;flex-direction:column;gap:12px">
                    <div className="form-field"><label>이름</label><input type="text" value="정미래" readOnly
                                                                        style="opacity:.7;cursor:default"/>
                    </div>
                    <div className="form-field"><label>이메일</label><input type="email"
                                                                         value="jung.mirae@reservehub.kr"/>
                    </div>
                    <div className="form-field"><label>연락처</label><input type="tel"
                                                                         value="010-9999-1234"/></div>
                    <button className="btn btn-primary"
                            style="align-self:flex-end;background:var(--accent);color:#0f0f13"
                            onClick="showToast('정보가 저장되었습니다.')">저장
                    </button>
                </div>
            </div>
            <div className="card">
                <div className="card-title">비밀번호 변경</div>
                <div style="display:flex;flex-direction:column;gap:12px">
                    <div className="form-field"><label>현재 비밀번호</label><input type="password"
                                                                             placeholder="••••••••"/>
                    </div>
                    <div className="form-field"><label>새 비밀번호</label><input type="password"
                                                                            placeholder="8자 이상"/>
                    </div>
                    <div className="form-field"><label>새 비밀번호 확인</label><input type="password"
                                                                               placeholder="동일하게 입력"/>
                    </div>
                    <button className="btn btn-ghost" style="align-self:flex-end"
                            onClick="showToast('비밀번호가 변경되었습니다.')">변경하기
                    </button>
                </div>
            </div>
        </div>
    </div>)
}