export default function SuperCalculationView() {
    return (<div className="page" id="super-calc">
        {/* ══════════════ 상담 계산툴 ══════════════ */}
        <div className="page-header">
            <div className="page-label">CALCULATOR</div>
            <div className="page-title">상담 계산툴</div>
            <div className="page-subtitle">수강권을 선택하고 할인을 적용해 최종 견적을 계산하세요</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;">
            {/* 좌: 선택 영역 */}
            <div style="display:flex;flex-direction:column;gap:14px;">

                {/* 수강권 선택 */}
                <div className="card">
                    <div className="card-title"
                         style="display:flex;align-items:center;justify-content:space-between;">
                        <span>① 수강권 선택</span>
                        <span
                            style="font-size:11px;color:var(--text-sub);font-weight:400">복수 선택 가능</span>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:6px;" id="passCheckList">
                        {/* JS 렌더 */}
                    </div>
                </div>

                {/* 할인 선택 */}
                <div className="card">
                    <div className="card-title">② 할인 적용</div>
                    <div style="display:flex;flex-direction:column;gap:6px;" id="discCheckList">
                        {/* JS 렌더 */}
                    </div>
                    {/* 직접 입력 */}
                    <div className="calc-disc-row" style="margin-top:6px;gap:10px;">
                        <input type="checkbox" id="customDiscCheck"
                               style="width:16px;height:16px;accent-color:var(--accent2);cursor:pointer;flex-shrink:0;"
                               onChange="calcRender()"/>
                        <div style="flex:1">
                            <div style="font-size:13px;font-weight:600">직접 할인 입력</div>
                            <div style="font-size:11px;color:var(--text-sub)">임의 할인율 적용</div>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px">
                            <input type="number" id="customDiscVal" value="0" min="0" max="100"
                                   style="width:60px;padding:4px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--rs);color:var(--text);font-size:13px;font-family:'DM Mono',monospace;outline:none;text-align:center;"
                                   onInput="calcRender()"/>
                            <span style="font-size:13px;color:var(--text-sub)">%</span>
                        </div>
                    </div>
                </div>

                {/* 메모 */}
                <div className="card">
                    <div className="card-title">③ 상담 메모</div>
                    <textarea id="calcMemo" placeholder="고객 특이사항이나 메모를 입력하세요..."
                              style="width:100%;min-height:72px;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--rs);color:var(--text);font-size:13px;font-family:'Pretendard',sans-serif;outline:none;resize:vertical;"
                              onInput="calcRender()"></textarea>
                </div>
            </div>

            {/* 우: 견적 출력 */}
            <div style="display:flex;flex-direction:column;gap:14px;">
                <div className="card">
                    <div className="card-title"
                         style="display:flex;align-items:center;justify-content:space-between;">
                        <span>💰 견적서</span>
                        <span
                            style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text-dim)"
                            id="calcTimestamp">—</span>
                    </div>
                    {/* 수강권 줄 */}
                    <div
                        style="font-size:11px;color:var(--text-sub);margin-bottom:6px;letter-spacing:.5px">수강권
                    </div>
                    <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px;"
                         id="quotePassList">
                        <div className="quote-row"><span
                            style="font-size:12px;color:var(--text-sub)">수강권을 선택하세요</span><span
                            style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text-dim)">0원</span>
                        </div>
                    </div>
                    <div
                        style="display:flex;justify-content:space-between;margin-bottom:12px;padding:8px 10px;background:var(--surface2);border-radius:var(--rs);">
                        <span style="font-size:12px;color:var(--text-sub)">소계</span>
                        <span style="font-family:'DM Mono',monospace;font-size:13px;font-weight:600"
                              id="quoteSubtotal">0원</span>
                    </div>
                    {/* 할인 줄 */}
                    <div
                        style="font-size:11px;color:var(--text-sub);margin-bottom:6px;letter-spacing:.5px">할인
                        내역 (순차 적용)
                    </div>
                    <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px;"
                         id="quoteDiscSteps">
                        <div className="quote-row"><span
                            style="font-size:12px;color:var(--text-sub)">할인 없음</span><span
                            style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text-dim)">0원</span>
                        </div>
                    </div>
                    {/* 절약 */}
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span style="font-size:12px;color:var(--text-sub)">총 절약</span>
                        <span style="font-family:'DM Mono',monospace;font-size:13px;color:var(--red)"
                              id="quoteSaving">— 0원</span>
                    </div>
                    {/* 최종 */}
                    <div
                        style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:rgba(79,209,197,.08);border:1px solid rgba(79,209,197,.3);border-radius:var(--rs);margin-bottom:14px;">
                        <span style="font-size:14px;font-weight:700">최종 금액</span>
                        <span
                            style="font-family:'DM Mono',monospace;font-size:22px;font-weight:700;color:var(--accent)"
                            id="quoteFinal">0원</span>
                    </div>
                    {/* 복사용 텍스트 */}
                    <textarea id="calcPreview" readOnly
                              style="width:100%;min-height:120px;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--rs);color:var(--text-sub);font-size:11px;font-family:'DM Mono',monospace;resize:none;outline:none;line-height:1.6;"></textarea>
                    <div style="display:flex;gap:8px;margin-top:10px;">
                        <button className="btn btn-primary"
                                style="flex:1;background:var(--accent);color:#0f0f13"
                                onClick="calcCopy()">📋 복사해서 전송
                        </button>
                        <button className="btn btn-ghost" onClick="calcReset()">초기화</button>
                    </div>
                </div>

                {/* 복사 이력 */}
                <div className="card">
                    <div className="card-title">상담 이력</div>
                    <div id="calcHistory" style="display:flex;flex-direction:column;gap:6px;">
                        <div
                            style="font-size:12px;color:var(--text-dim);text-align:center;padding:12px 0">복사
                            시 자동 기록됩니다
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>)
}