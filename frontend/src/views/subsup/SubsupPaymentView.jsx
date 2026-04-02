export default function SubsupPaymentView() {
    return (
        <div className="page" id="super-payment">

            {/* ══════════════ 수강권/결제 ══════════════ */}
            <div className="page-header">
                <div className="page-label">Payment</div>
                <div className="page-title">수강권 / 결제 정책</div>
                <div className="page-subtitle">수강권과 할인 정책을 관리하세요</div>
            </div>
            <div className="tab-row">
                <button className="tab-btn active" onClick="paymentTab('pass',this)">수강권 목록</button>
                <button className="tab-btn" onClick="paymentTab('discount',this)">할인 정책</button>
                <button className="tab-btn" onClick="paymentTab('history',this)">결제 현황</button>
            </div>

            {/* 수강권 목록 */}
            <div className="tab-pane active" id="btab-pass">
                <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '14px'}}>
                    <button className="btn btn-primary btn-sm" onClick="openPassModal()">+ 수강권 추가</button>
                </div>
                <div className="card" style={{padding: '0', overflow: 'hidden', marginBottom: '16px'}}>
                    <div style={{overflowX: 'auto'}}>
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th>수강권명</th>
                                <th>금액</th>
                                <th>기간</th>
                                <th>가입자</th>
                                <th>상태</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td style={{fontWeight: '600'}}>그룹 월정액</td>
                                <td style={{fontFamily: '\'DM Mono\',monospace', color: 'var(--accent)'}}>95,000원</td>
                                <td>30일</td>
                                <td>98명</td>
                                <td><span className="badge bs-active" style={{fontSize: '10px'}}>판매중</span></td>
                                <td>
                                    <button className="btn btn-ghost btn-sm">수정</button>
                                </td>
                            </tr>
                            <tr>
                                <td style={{fontWeight: '600'}}>개인 10회권</td>
                                <td style={{fontFamily: '\'DM Mono\',monospace', color: 'var(--accent)'}}>350,000원</td>
                                <td>60일</td>
                                <td>24명</td>
                                <td><span className="badge bs-active" style={{fontSize: '10px'}}>판매중</span></td>
                                <td>
                                    <button className="btn btn-ghost btn-sm">수정</button>
                                </td>
                            </tr>
                            <tr>
                                <td style={{fontWeight: '600'}}>개인 5회권</td>
                                <td style={{fontFamily: '\'DM Mono\',monospace', color: 'var(--accent)'}}>190,000원</td>
                                <td>45일</td>
                                <td>12명</td>
                                <td><span className="badge bs-active" style={{fontSize: '10px'}}>판매중</span></td>
                                <td>
                                    <button className="btn btn-ghost btn-sm">수정</button>
                                </td>
                            </tr>
                            <tr>
                                <td style={{fontWeight: '600'}}>체험 1회권</td>
                                <td style={{fontFamily: '\'DM Mono\',monospace', color: 'var(--accent)'}}>30,000원</td>
                                <td>1일</td>
                                <td>20명</td>
                                <td><span className="badge bs-expired" style={{fontSize: '10px'}}>중단</span></td>
                                <td>
                                    <button className="btn btn-ghost btn-sm">수정</button>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card">
                    <div className="card-title">이번달 결제 현황</div>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px'}}>
                        <div
                            style={{background: 'var(--surface2)', borderRadius: 'var(--rs)', padding: '14px', textAlign: 'center'}}>
                            <div
                                style={{fontFamily: '\'DM Mono\',monospace', fontSize: '20px', color: 'var(--accent)'}}>9.8만
                            </div>
                            <div style={{fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px'}}>총 매출</div>
                        </div>
                        <div
                            style={{background: 'var(--surface2)', borderRadius: 'var(--rs)', padding: '14px', textAlign: 'center'}}>
                            <div
                                style={{fontFamily: '\'DM Mono\',monospace', fontSize: '20px', color: 'var(--accent2)'}}>118건
                            </div>
                            <div style={{fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px'}}>결제 수</div>
                        </div>
                        <div
                            style={{background: 'var(--surface2)', borderRadius: 'var(--rs)', padding: '14px', textAlign: 'center'}}>
                            <div
                                style={{fontFamily: '\'DM Mono\',monospace', fontSize: '20px', color: 'var(--accent3)'}}>78%
                            </div>
                            <div style={{fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px'}}>재등록률</div>
                        </div>
                        <div
                            style={{background: 'var(--surface2)', borderRadius: 'var(--rs)', padding: '14px', textAlign: 'center'}}>
                            <div
                                style={{fontFamily: '\'DM Mono\',monospace', fontSize: '20px', color: 'var(--green)'}}>5명
                            </div>
                            <div style={{fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px'}}>신규 가입</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 할인 정책 */}
            <div className="tab-pane" id="btab-discount">
                <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '14px'}}>
                    <button className="btn btn-primary btn-sm" onClick="openDiscountModal()">+ 할인 정책 추가
                    </button>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}
                     id="discount-list">{/* JS 렌더 */}</div>
            </div>

            {/* 결제 현황 */}
            <div className="tab-pane" id="btab-history">
                <div className="card" style={{padding: '0', overflow: 'hidden'}}>
                    <div style={{overflowX: 'auto'}}>
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th>날짜</th>
                                <th>회원</th>
                                <th>수강권</th>
                                <th>금액</th>
                                <th>할인</th>
                                <th>최종</th>
                                <th>상태</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td style={{fontFamily: '\'DM Mono\',monospace', fontSize: '12px'}}>03.10</td>
                                <td style={{fontWeight: '600'}}>오지현</td>
                                <td>그룹 월정액</td>
                                <td style={{fontFamily: '\'DM Mono\',monospace'}}>95,000</td>
                                <td style={{fontFamily: '\'DM Mono\',monospace', color: 'var(--accent3)'}}>-0</td>
                                <td style={{fontFamily: '\'DM Mono\',monospace', color: 'var(--accent)'}}>95,000</td>
                                <td><span className="badge bs-active" style={{fontSize: '10px'}}>완료</span></td>
                            </tr>
                            <tr>
                                <td style={{fontFamily: '\'DM Mono\',monospace', fontSize: '12px'}}>03.07</td>
                                <td style={{fontWeight: '600'}}>홍길동</td>
                                <td>그룹 월정액</td>
                                <td style={{fontFamily: '\'DM Mono\',monospace'}}>95,000</td>
                                <td style={{fontFamily: '\'DM Mono\',monospace', color: 'var(--accent3)'}}>-9,500</td>
                                <td style={{fontFamily: '\'DM Mono\',monospace', color: 'var(--accent)'}}>85,500</td>
                                <td><span className="badge bs-active" style={{fontSize: '10px'}}>완료</span></td>
                            </tr>
                            <tr>
                                <td style={{fontFamily: '\'DM Mono\',monospace', fontSize: '12px'}}>03.05</td>
                                <td style={{fontWeight: '600'}}>박서준</td>
                                <td>개인 10회권</td>
                                <td style={{fontFamily: '\'DM Mono\',monospace'}}>350,000</td>
                                <td style={{fontFamily: '\'DM Mono\',monospace', color: 'var(--accent3)'}}>-35,000</td>
                                <td style={{fontFamily: '\'DM Mono\',monospace', color: 'var(--accent)'}}>315,000</td>
                                <td><span className="badge bs-pending" style={{fontSize: '10px'}}>환불 요청</span>
                                </td>
                            </tr>
                            <tr>
                                <td style={{fontFamily: '\'DM Mono\',monospace', fontSize: '12px'}}>03.03</td>
                                <td style={{fontWeight: '600'}}>김민지</td>
                                <td>그룹 월정액</td>
                                <td style={{fontFamily: '\'DM Mono\',monospace'}}>95,000</td>
                                <td style={{fontFamily: '\'DM Mono\',monospace', color: 'var(--accent3)'}}>-0</td>
                                <td style={{fontFamily: '\'DM Mono\',monospace', color: 'var(--accent)'}}>95,000</td>
                                <td><span className="badge bs-active" style={{fontSize: '10px'}}>완료</span></td>
                            </tr>
                            <tr>
                                <td style={{fontFamily: '\'DM Mono\',monospace', fontSize: '12px'}}>03.01</td>
                                <td style={{fontWeight: '600'}}>이나은</td>
                                <td>개인 5회권</td>
                                <td style={{fontFamily: '\'DM Mono\',monospace'}}>190,000</td>
                                <td style={{fontFamily: '\'DM Mono\',monospace', color: 'var(--accent3)'}}>-19,000</td>
                                <td style={{fontFamily: '\'DM Mono\',monospace', color: 'var(--accent)'}}>171,000</td>
                                <td><span className="badge bs-active" style={{fontSize: '10px'}}>완료</span></td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>)
}