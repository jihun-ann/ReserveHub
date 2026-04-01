export default function SuperCalculationView() {
    return (<div className="page" id="super-calc">

        {/* ══════════════ 상담 계산툴 ══════════════ */}
        <div className="page-header">
            <div className="page-label">CALCULATOR</div>
            <div className="page-title">상담 계산툴</div>
            <div className="page-subtitle">수강권을 선택하고 할인을 적용해 최종 견적을 계산하세요</div>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start'}}>
            {/* 좌: 선택 영역 */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>

                {/* 수강권 선택 */}
                <div className="card">
                    <div className="card-title"
                         style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                        <span>① 수강권 선택</span>
                        <span
                            style={{fontSize: '11px', color: 'var(--text-sub)', fontWeight: '400'}}>복수 선택 가능</span>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}} id="passCheckList">
                        {/* JS 렌더 */}
                    </div>
                </div>

                {/* 할인 선택 */}
                <div className="card">
                    <div className="card-title">② 할인 적용</div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}} id="discCheckList">
                        {/* JS 렌더 */}
                    </div>
                    {/* 직접 입력 */}
                    <div className="calc-disc-row" style={{marginTop: '6px', gap: '10px'}}>
                        <input type="checkbox" id="customDiscCheck"
                               style={{width: '16px', height: '16px', accentColor: 'var(--accent2)', cursor: 'pointer', flexShrink: '0'}}
                               onChange={calcRender}/>
                        <div style={{flex: '1'}}>
                            <div style={{fontSize: '13px', fontWeight: '600'}}>직접 할인 입력</div>
                            <div style={{fontSize: '11px', color: 'var(--text-sub)'}}>임의 할인율 적용</div>
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                            <input type="number" id="customDiscVal" value="0" min="0" max="100"
                                   style={{width: '60px', padding: '4px 8px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--rs)', color: 'var(--text)', fontSize: '13px', fontFamily: '\'DM Mono\',monospace', outline: 'none', textAlign: 'center'}}
                                   onInput={calcRender}/>
                            <span style={{fontSize: '13px', color: 'var(--text-sub)'}}>%</span>
                        </div>
                    </div>
                </div>

                {/* 메모 */}
                <div className="card">
                    <div className="card-title">③ 상담 메모</div>
                    <textarea id="calcMemo" placeholder="고객 특이사항이나 메모를 입력하세요..."
                              style={{width: '100%', minHeight: '72px', padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--rs)', color: 'var(--text)', fontSize: '13px', fontFamily: '\'Pretendard\',sans-serif', outline: 'none', resize: 'vertical'}}
                              onInput={calcRender}></textarea>
                </div>
            </div>

            {/* 우: 견적 출력 */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                <div className="card">
                    <div className="card-title"
                         style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                        <span>💰 견적서</span>
                        <span
                            style={{fontFamily: '\'DM Mono\',monospace', fontSize: '10px', color: 'var(--text-dim)'}}
                            id="calcTimestamp">—</span>
                    </div>
                    {/* 수강권 줄 */}
                    <div
                        style={{fontSize: '11px', color: 'var(--text-sub)', marginBottom: '6px', letterSpacing: '.5px'}}>수강권
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px'}}
                         id="quotePassList">
                        <div className="quote-row"><span
                            style={{fontSize: '12px', color: 'var(--text-sub)'}}>수강권을 선택하세요</span><span
                            style={{fontFamily: '\'DM Mono\',monospace', fontSize: '12px', color: 'var(--text-dim)'}}>0원</span>
                        </div>
                    </div>
                    <div
                        style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', padding: '8px 10px', background: 'var(--surface2)', borderRadius: 'var(--rs)'}}>
                        <span style={{fontSize: '12px', color: 'var(--text-sub)'}}>소계</span>
                        <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '13px', fontWeight: '600'}}
                              id="quoteSubtotal">0원</span>
                    </div>
                    {/* 할인 줄 */}
                    <div
                        style={{fontSize: '11px', color: 'var(--text-sub)', marginBottom: '6px', letterSpacing: '.5px'}}>할인
                        내역 (순차 적용)
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px'}}
                         id="quoteDiscSteps">
                        <div className="quote-row"><span
                            style={{fontSize: '12px', color: 'var(--text-sub)'}}>할인 없음</span><span
                            style={{fontFamily: '\'DM Mono\',monospace', fontSize: '12px', color: 'var(--text-dim)'}}>0원</span>
                        </div>
                    </div>
                    {/* 절약 */}
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                        <span style={{fontSize: '12px', color: 'var(--text-sub)'}}>총 절약</span>
                        <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '13px', color: 'var(--red)'}}
                              id="quoteSaving">— 0원</span>
                    </div>
                    {/* 최종 */}
                    <div
                        style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'rgba(79,209,197,.08)', border: '1px solid rgba(79,209,197,.3)', borderRadius: 'var(--rs)', marginBottom: '14px'}}>
                        <span style={{fontSize: '14px', fontWeight: '700'}}>최종 금액</span>
                        <span
                            style={{fontFamily: '\'DM Mono\',monospace', fontSize: '22px', fontWeight: '700', color: 'var(--accent)'}}
                            id="quoteFinal">0원</span>
                    </div>
                    {/* 복사용 텍스트 */}
                    <textarea id="calcPreview" readOnly
                              style={{width: '100%', minHeight: '120px', padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--rs)', color: 'var(--text-sub)', fontSize: '11px', fontFamily: '\'DM Mono\',monospace', resize: 'none', outline: 'none', lineHeight: '1.6'}}></textarea>
                    <div style={{display: 'flex', gap: '8px', marginTop: '10px'}}>
                        <button className="btn btn-primary"
                                style={{flex: '1', background: 'var(--accent)', color: '#0f0f13'}}
                                onClick={calcCopy}>📋 복사해서 전송
                        </button>
                        <button className="btn btn-ghost" onClick={calcReset}>초기화</button>
                    </div>
                </div>

                {/* 복사 이력 */}
                <div className="card">
                    <div className="card-title">상담 이력</div>
                    <div id="calcHistory" style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                        <div style={{fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center', padding: '12px 0'}}>복사
                            시 자동 기록됩니다
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>)

    function calcCopy() {
        const text = document.getElementById('calcPreview')?.value;
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            const hist = document.getElementById('calcHistory');
            if (hist) {
                const final = document.getElementById('quoteFinal')?.textContent || '—';
                const now = new Date();
                const ts = (now.getMonth()+1).toString().padStart(2,'0') + '.' + now.getDate().toString().padStart(2,'0') + ' ' + now.toTimeString().slice(0,5);
                const passes = [...document.querySelectorAll('.calc-pass-row')].filter(r => r.querySelector('input').checked).map(r => r.dataset.name + '×' + r.querySelector('.qty-val').textContent).join(', ') || '—';
                const placeholder = hist.querySelector('[style*="자동 기록"]');
                if (placeholder) placeholder.remove();
                hist.insertAdjacentHTML('afterbegin', `<div style="display:flex;justify-content:space-between;padding:9px 12px;background:rgba(79,209,197,.06);border:1px solid rgba(79,209,197,.2);border-radius:var(--rs)"><div><div style="font-size:12px;font-weight:600">${passes}</div></div><div style="text-align:right"><div style="font-family:'DM Mono',monospace;font-size:13px;color:var(--accent)">${final}</div><div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text-dim)">${ts}</div></div></div>`);
            }
            showToast('📋 클립보드에 복사되었습니다!');
        }).catch(() => showToast('📋 복사 완료!'));
    }

    function calcReset() {
        document.querySelectorAll('.calc-pass-row input, .calc-disc-row input, #customDiscCheck').forEach(cb => { cb.checked = false; });
        document.querySelectorAll('.calc-pass-row, .calc-disc-row').forEach(r => r.classList.remove('checked'));
        document.querySelectorAll('.qty-val').forEach(s => s.textContent = '1');
        const cv = document.getElementById('customDiscVal'); if (cv) cv.value = '0';
        const cm = document.getElementById('calcMemo'); if (cm) cm.value = '';
        calcRender();
    }

    function calcRender() {
        const passRows = document.querySelectorAll('.calc-pass-row');
        let passes = [], subtotal = 0;
        passRows.forEach(row => {
            const cb = row.querySelector('input[type=checkbox]');
            row.classList.toggle('checked', cb.checked);
            if (!cb.checked) return;
            const price = parseInt(row.dataset.price), qty = parseInt(row.querySelector('.qty-val').textContent);
            const lineTotal = price * qty;
            passes.push({ name:row.dataset.name, price, qty, unit:row.dataset.unit, lineTotal });
            subtotal += lineTotal;
        });

        const discRows = document.querySelectorAll('.calc-disc-row');
        let discs = [];
        discRows.forEach(row => {
            const cb = row.querySelector('input[type=checkbox]');
            row.classList.toggle('checked', cb.checked);
            if (!cb.checked) return;
            discs.push({ name:row.dataset.name, rate:parseFloat(row.dataset.rate) });
        });
        const customCb = document.getElementById('customDiscCheck');
        if (customCb && customCb.checked) {
            const rate = parseFloat(document.getElementById('customDiscVal').value) || 0;
            if (rate > 0) discs.push({ name:'직접 할인', rate });
        }

        let running = subtotal, steps = [], totalSaved = 0;
        discs.forEach(d => {
            const amt = running * d.rate / 100;
            totalSaved += amt;
            steps.push({ name:d.name, rate:d.rate, amt, before:running, after:running - amt });
            running -= amt;
        });

        const passListEl = document.getElementById('quotePassList');
        if (passListEl) {
            passListEl.innerHTML = passes.length === 0
                ? '<div class="quote-row"><span style="font-size:12px;color:var(--text-sub)">수강권을 선택하세요</span><span style="font-family:\'DM Mono\',monospace;font-size:12px;color:var(--text-dim)">0원</span></div>'
                : passes.map(p => `<div class="quote-row"><span style="font-size:12px">${p.name} × ${p.qty}</span><span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--accent)">${fmt(p.lineTotal)}</span></div>`).join('');
        }
        const set = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = v; };
        set('quoteSubtotal', fmt(subtotal));
        const discEl = document.getElementById('quoteDiscSteps');
        if (discEl) {
            discEl.innerHTML = steps.length === 0
                ? '<div class="quote-row"><span style="font-size:12px;color:var(--text-sub)">할인 없음</span><span style="font-family:\'DM Mono\',monospace;font-size:12px;color:var(--text-dim)">0원</span></div>'
                : steps.map((d,i) => `<div class="quote-disc-row"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-size:12px;font-weight:600;color:var(--accent2)">${i+1}. ${d.name} (${d.rate}%)</span><span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--red)">— ${fmt(d.amt)}</span></div><div style="font-size:10px;color:var(--text-dim)">${fmt(d.before)} × ${d.rate}% → ${fmt(d.after)}</div></div>`).join('');
        }
        set('quoteFinal', fmt(running));
        set('quoteSaving', '— ' + fmt(totalSaved));
        const now = new Date();
        set('calcTimestamp', (now.getMonth()+1).toString().padStart(2,'0') + '.' + now.getDate().toString().padStart(2,'0') + ' ' + now.toTimeString().slice(0,5));

        // 미리보기
        const platName = PLATS_DATA[currentPlat].name;
        const memo = document.getElementById('calcMemo')?.value || '';
        let lines = [`[${platName} 수강권 안내]`, ''];
        if (passes.length) { lines.push('■ 수강권'); passes.forEach(p => lines.push(`  · ${p.name} × ${p.qty}  ${fmt(p.lineTotal)}`)); lines.push(`  소계: ${fmt(subtotal)}`); lines.push(''); }
        if (steps.length) { lines.push('■ 할인 내역'); steps.forEach((d,i) => lines.push(`  ${i+1}. ${d.name} ${d.rate}%  — ${fmt(d.amt)}`)); lines.push(`  총 절약: ${fmt(totalSaved)}`); lines.push(''); }
        lines.push(`■ 최종 금액: ${fmt(running)}`);
        if (memo) { lines.push(''); lines.push(`메모: ${memo}`); }
        const prev = document.getElementById('calcPreview');
        if (prev) prev.value = lines.join('\n');
    }
}