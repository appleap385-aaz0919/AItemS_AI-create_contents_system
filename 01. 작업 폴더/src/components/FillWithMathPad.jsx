import { useState, useRef } from 'react';

export function FillWithMathPad({value, onChange, disabled, borderColor, schoolLevel}) {
  const [showPad, setShowPad] = useState(false);
  const [showMathTypeMsg, setShowMathTypeMsg] = useState(false);
  const inputRef = useRef(null);
  const mathDivRef = useRef(null);

  const handleKey = (k) => {
    if (disabled) return;
    if (k === "⌫") { onChange(value.slice(0, -1)); }
    else if (k === "C") { onChange(""); }
    else { onChange(value + k); }
    if (inputRef.current) inputRef.current.focus();
  };

  const handleMathType = () => {
    if (disabled) return;
    const toolbar = schoolLevel === "초등" ? "elementary" : schoolLevel === "고등" ? "high" : "";
    if (typeof window.showMathType === "function") {
      window.showMathType("mathtype-fill", mathDivRef.current?.innerHTML || "", toolbar);
    } else {
      setShowMathTypeMsg(true);
      setTimeout(() => setShowMathTypeMsg(false), 3000);
    }
  };

  const numKeys = ["7","8","9","4","5","6","1","2","3","0",".","/"];
  const opKeys = ["+","−","×","÷","=","²","³","√","(",")",",","⌫"];

  return (
    <div className="fill-math-wrap">
      <div className="fill-input-row">
        <input ref={inputRef} className="fli"
          value={value} onChange={e=>!disabled&&onChange(e.target.value)}
          placeholder="키보드로 정답 입력"
          readOnly={disabled}
          style={borderColor?{borderColor}:{}}
        />
      </div>
      <div className="fill-btn-row">
        <button className={`math-toggle ${showPad?"active":""}`}
          onClick={()=>!disabled&&setShowPad(!showPad)}
          disabled={disabled}>
          {showPad?"▼ 숫자패드 닫기":"🔢 숫자패드"}
        </button>
        <button className="mathtype-btn"
          onClick={handleMathType}
          disabled={disabled}>
          📐 MathType 수식입력기
        </button>
      </div>
      <div ref={mathDivRef} id="mathtype-fill" style={{display:"none"}}
        onClick={()=>handleMathType()}></div>
      {showMathTypeMsg&&(
        <div className="mathtype-msg">
          ℹ️ MathType(common-mathtype.js)는 OctoPlayer 컨테이너에서 로딩됩니다. 현재 프로토타입 환경에서는 시뮬레이션입니다.
        </div>
      )}
      {showPad&&!disabled&&(
        <div className="math-pad">
          <div className="math-pad-head">
            <span className="math-pad-title">🔢 숫자 패드</span>
            <span className="math-pad-hint">키보드도 함께 사용 가능</span>
            <button className="math-pad-close" onClick={()=>setShowPad(false)}>✕</button>
          </div>
          <div className="math-pad-body">
            <div className="math-pad-section">
              <div className="math-pad-label">숫자</div>
              <div className="math-keys num-keys">
                {numKeys.map(k=><button key={k} className="math-key" onClick={()=>handleKey(k)}>{k}</button>)}
              </div>
            </div>
            <div className="math-pad-section">
              <div className="math-pad-label">연산·기호</div>
              <div className="math-keys op-keys">
                {opKeys.map(k=><button key={k} className={`math-key ${k==="⌫"?"key-del":""}`}
                  onClick={()=>handleKey(k)}>{k}</button>)}
              </div>
            </div>
          </div>
          <div className="math-pad-footer">
            <button className="math-key key-clear" onClick={()=>handleKey("C")}>전체 지우기</button>
            <button className="math-pad-done" onClick={()=>setShowPad(false)}>✅ 입력 완료</button>
          </div>
        </div>
      )}
    </div>
  );
}
