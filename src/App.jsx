import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Hand, Heart, Volume2, VolumeX, X, Gem, KeyRound, Coins as CoinIcon, Sparkles } from 'lucide-react';
import './App.css';
const questions = [
 { title: 'Con số trong kho báu', text: 'Theo ghi chú bài học, vua Sô-lô-môn nhận bao nhiêu ta-lâng vàng mỗi năm?', options: ['600 ta-lâng', '666 ta-lâng', '60 ta-lâng'], answer: 1, note: 'Ghi chú liên hệ con số 666 với lượng vàng Sô-lô-môn nhận hằng năm.' },
 { title: 'Dấu vết của pho tượng', text: 'Pho tượng trong Đa-ni-ên 3 có kích thước nào?', options: ['Cao 60, rộng 6 cu-bít', 'Cao 6, rộng 60 cu-bít', 'Cao 66, rộng 6 cu-bít'], answer: 0, note: 'Đa-ni-ên 3:1 mô tả pho tượng cao 60 cu-bít và rộng 6 cu-bít.' },
 { title: 'Mảnh ghép cuối cùng', text: 'Theo nội dung bài học, điểm nào được nhấn mạnh trong câu chuyện Sô-lô-môn?', options: ['Xây thêm kho chứa vàng', 'Thờ các thần ngoại bang', 'Từ bỏ ngôi vua'], answer: 1, note: 'Bài học nhấn mạnh việc Sô-lô-môn thờ thần ngoại bang. Nội dung này dùng để minh họa trải nghiệm.' },
];
function Coins({ burst = false }) { return <div className={`coins ${burst ? 'burst' : 'scattered'}`} aria-hidden="true">{Array.from({length: burst ? 9 : 14}, (_, i) => <i key={i} style={{'--i':i, '--x':`${Math.sin(i*2.4)*145}px`, '--y':`${-90-(i%4)*30}px`, '--r':`${i*47}deg`, left:burst ? 0 : `${Math.sin(i*2.4)*145}px`, top:burst ? 0 : `${i%3*9}px`}}>✦</i>)}</div>; }
export default function App() {
 const [phase,setPhase]=useState('idle'), [index,setIndex]=useState(0), [choice,setChoice]=useState(null), [sound,setSound]=useState(false);
 const timers=useRef([]), audio=useRef(null); const tg=window.Telegram?.WebApp; const q=questions[index];
 useEffect(()=>{tg?.ready();tg?.expand();return()=>{timers.current.forEach(clearTimeout);audio.current?.close();};},[tg]);
 function later(fn,ms){timers.current.push(setTimeout(fn,ms));}
 function chime(){if(!sound)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audio.current ||= new AC();const ctx=audio.current;ctx.resume();[523,659,784].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain(),at=ctx.currentTime+i*.09;o.connect(g);g.connect(ctx.destination);o.frequency.value=f;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(.05,at+.015);g.gain.exponentialRampToValueAtTime(.001,at+.5);o.start(at);o.stop(at+.5);});}
 function open(){if(!['idle','done'].includes(phase))return;setIndex(0);setChoice(null);setPhase('shaking');tg?.HapticFeedback?.impactOccurred('medium');chime();later(()=>setPhase('opening'),550);later(()=>setPhase('entering'),1350);later(()=>setPhase('quiz'),2150);}
 function close(){setPhase('closing');later(()=>setPhase('done'),950);}
 function next(){if(index===questions.length-1){setPhase('reward');chime();}else{setIndex(index+1);setChoice(null);}}
 const inside=['quiz','reward'].includes(phase), opened=['opening','entering','quiz','reward'].includes(phase);
 return <main className={`experience phase-${phase}`}><div className="grain"/>
 <header className="topbar"><div className="brand"><span>✦</span> KHO BÁU <small>/ 666</small></div><button className="icon-button" onClick={()=>setSound(!sound)} aria-label={sound?'Tắt âm thanh':'Bật âm thanh'}>{sound?<Volume2 size={18}/>:<VolumeX size={18}/>}</button></header>
 <section className="outside" aria-hidden={inside}><div className="intro"><span className="eyebrow">MỘT HÀNH TRÌNH KHÁM PHÁ</span><h1>Bí mật trong<br/><em>chiếc rương vàng.</em></h1><p>Mỗi kho báu đều cất giữ một điều đặc biệt.<br/>Chạm để khám phá điều đang chờ bạn.</p></div>
 <div className="treasure-scene"><div className="scene-ornaments" aria-hidden="true"><Gem className="scene-gem" strokeWidth={1.2}/><KeyRound className="scene-key" strokeWidth={1.2}/><CoinIcon className="scene-coins" strokeWidth={1.2}/><Sparkles className="scene-sparkles" strokeWidth={1.2}/></div><div className="halo"/><div className="rays"/><div className="floor"/><div className="orbit"/><div className="orbit second"/><span className="glint g1">✧</span><span className="glint g2">✦</span><span className="glint g3">✧</span><Coins/>
 <button className={`chest-button ${opened?'is-open':''}`} disabled={!['idle','done'].includes(phase)} onClick={open} aria-label="Mở rương kho báu"><span className="chest-light"/><span className="chest-sprite"/><span className="seal">666</span></button>{opened&&<Coins burst/>}<div className="scene-caption">{phase==='shaking'?'Bí mật đang thức giấc…':opened?'Ánh sáng đang dẫn lối…':'MỘT CHẠM · MỘT ĐIỀU BẤT NGỜ'}</div></div>
 <div className="start-area"><div className={`tap-guide ${['idle','done'].includes(phase)?'visible':''}`}><span className="tap-hand" aria-hidden="true"><span className="tap-ring"/><Hand size={28} strokeWidth={1.4}/></span><span id="chest-hint">{phase==='done'?'Chạm vào rương để khám phá lại':'Chạm vào rương để mở bí mật'}</span></div><p>{phase==='done'?'Rương đã khép. Lời chúc vẫn ở lại cùng bạn.':'3 mảnh ghép kiến thức · 1 món quà dành cho bạn'}</p></div></section>
 <div className="gold-transition"/>
 {inside&&<section className="interior"><div className="inner-frame"/><div className="treasure-ornaments" aria-hidden="true"><Gem className="ornament gem" strokeWidth={1}/><KeyRound className="ornament key" strokeWidth={1}/><CoinIcon className="ornament coin" strokeWidth={1}/><Sparkles className="ornament sparks" strokeWidth={1}/></div><div className="corner-coins left">● ●<br/>● ● ●</div><div className="corner-coins right">● ●<br/>● ● ●</div><div className="interior-top"><span className="eyebrow interior-title">BÍ MẬT THIÊN ĐÀNG</span><button className="icon-button" onClick={close} aria-label="Đóng rương"><X size={18}/></button></div>
 {phase==='quiz'?<article className="quiz-card question-card" key={index} aria-labelledby="quiz-question">
   <div className="quiz-scroll">
     <div className="card-meta"><span>MẢNH GHÉP {String(index+1).padStart(2,'0')}</span><span>{index+1} / {questions.length}</span></div>
     <div className="progress" aria-label={`Câu ${index+1} trên ${questions.length}`}>{questions.map((_,i)=><span key={i} className={i<=index?'filled':''}/>)}</div>
     <p className="question-topic">{q.title}</p>
     <h2 className="question" id="quiz-question">{q.text}</h2>
     <div className="answers">{q.options.map((o,i)=><button key={o} disabled={choice!==null} onClick={()=>{setChoice(i);tg?.HapticFeedback?.impactOccurred('light');}} className={`answer ${choice!==null&&i===q.answer?'correct':''} ${choice===i&&i!==q.answer?'incorrect':''}`}><span>{String.fromCharCode(65+i)}</span><span className="answer-text">{o}</span><b className="answer-mark">{choice!==null&&i===q.answer?'✓':choice===i?'×':''}</b></button>)}</div>
   </div>
   <div className="quiz-bottom">
     <div className={`quiz-response ${choice===null?'waiting':''}`} role="status" aria-live="polite"><strong>{choice===null?'Một mảnh ghép đang chờ bạn.':choice===q.answer?'Chính xác! Bí mật dần hé lộ.':'Đáp án đúng đã được thắp sáng.'}</strong><p>{choice===null?'Chọn một đáp án phía trên để khám phá.':q.note}</p></div>
     <button className="gold-button quiz-next" disabled={choice===null} onClick={next}>{index===questions.length-1?'Nhận món quà':'Mảnh ghép tiếp theo'}<ArrowRight size={16}/></button>
   </div>
 </article>:<article className="quiz-card reward-card"><div className="wish-hearts" aria-hidden="true"><Heart/><Heart/><Heart/></div><span className="eyebrow">MÓN QUÀ DÀNH CHO CÁC ANH EM</span><h2>Chúc các anh em<br/>ăn trưa ngon miệng!</h2><p className="warm-wish">Mong bữa trưa hôm nay có món ngon, có tiếng cười và có niềm vui khi được ở bên nhau.</p><p className="wish-signoff">Cảm ơn các anh em đã cùng nhau học hỏi và sẻ chia. Thương chúc cả nhà một buổi chiều thật nhiều năng lượng!</p><button className="gold-button gratitude-button" onClick={close} aria-label="Camsamita, cảm ơn và đóng rương">Camsamita <span className="prayer-icons">🙏🙏🙏</span></button></article>}<p className="interior-footer">✦ &nbsp; KHO BÁU CỦA TRI THỨC &nbsp; ✦</p></section>}
 <footer className="page-footer"><span>KHÁM PHÁ · SUY NGẪM · ĐÓN NHẬN</span><span>PHIÊN BẢN TRẢI NGHIỆM</span></footer></main>;
}
