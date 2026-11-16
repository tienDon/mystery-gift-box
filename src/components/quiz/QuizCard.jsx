import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Circle, Square, X } from 'lucide-react';
import { isAnswerCorrect, toggleOption } from './quizLogic';
import './QuizCard.css';

export default function QuizCard({ question, index, total, onNext, onSelect, onConfirm }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmed, setConfirmed] = useState(false);
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const multiple = question.type === 'multiple';
  const correct = isAnswerCorrect(selectedIds, question.correctOptionIds);
  const correctLabels = question.options
    .flatMap((option, i) => question.correctOptionIds.includes(option.id) ? [String.fromCharCode(65 + i)] : []);

  function select(id) {
    if (confirmed) return;
    setSelectedIds(ids => toggleOption(ids, id, question.type));
    onSelect?.();
  }

  function submit(event) {
    event.preventDefault();
    if (!selectedIds.length) return;
    if (confirmed) onNext();
    else {
      setConfirmed(true);
      onConfirm?.(correct);
    }
  }

  return <form className="quiz-card question-card live-quiz" onSubmit={submit} aria-labelledby={`question-${question.id}`}>
    <div className="quiz-scroll">
      <div className="card-meta"><span>MẢNH GHÉP {String(index + 1).padStart(2, '0')}</span><span>{index + 1} / {total}</span></div>
      <div className="quiz-meter" role="progressbar" aria-label="Tiến trình câu hỏi" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + 1}><span style={{ width: `${(index + 1) / total * 100}%` }} /></div>
      <p className="question-topic">{question.topic}</p>
      <h2 className="question" id={`question-${question.id}`} ref={heading} tabIndex={-1}>{question.prompt}</h2>
      {question.image?.src && <figure className="question-image"><img src={question.image.src} alt={question.image.alt || ''} loading="lazy" decoding="async" />{question.image.caption && <figcaption>{question.image.caption}</figcaption>}</figure>}
      <fieldset className="quiz-options" disabled={confirmed}>
        <legend>{multiple ? 'Chọn tất cả đáp án đúng' : 'Chọn một đáp án'}</legend>
        <div className="answers">{question.options.map((option, i) => {
          const selected = selectedIds.includes(option.id);
          const right = question.correctOptionIds.includes(option.id);
          const state = confirmed ? right ? 'correct' : selected ? 'incorrect' : 'muted' : selected ? 'selected' : '';
          return <label className={`answer quiz-option ${state}`} key={option.id}>
            <input type={multiple ? 'checkbox' : 'radio'} name={`answer-${question.id}`} value={option.id} checked={selected} onChange={() => select(option.id)} />
            <span className="option-letter" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
            <span className="option-text">{option.text}</span>
            <span className="option-indicator" aria-hidden="true">{confirmed && right ? <Check /> : confirmed && selected ? <X /> : selected ? <Check /> : multiple ? <Square /> : <Circle />}</span>
            {confirmed && <span className="sr-only">{right ? 'Đáp án đúng.' : selected ? 'Bạn chọn chưa đúng.' : ''}</span>}
          </label>;
        })}</div>
      </fieldset>
    </div>
    <div className="quiz-bottom">
      <div className={`quiz-response ${confirmed ? correct ? 'result-correct' : 'result-review' : 'waiting'}`} role="status" aria-live="polite" aria-atomic="true">
        <strong>{confirmed ? correct ? 'Chính xác! Bạn đã tìm được mảnh ghép.' : 'Cùng xem lại mảnh ghép này nhé.' : selectedIds.length ? `Đã chọn ${selectedIds.length} đáp án` : 'Một mảnh ghép đang chờ bạn.'}</strong>
        <p>{confirmed ? `Đáp án theo bài học: ${correctLabels.join(', ')}.` : multiple ? 'Bạn có thể chọn nhiều đáp án và đổi trước khi xác nhận.' : 'Bạn có thể đổi lựa chọn trước khi xác nhận.'}</p>
        {confirmed && (question.explanation || question.references?.length > 0) && <details className="answer-details"><summary>Xem giải thích</summary>{question.explanation && <p>{question.explanation}</p>}{question.references?.map((reference, i) => <p key={i}>{reference.url ? <a href={reference.url} target="_blank" rel="noreferrer">{reference.label}</a> : reference.label}</p>)}</details>}
      </div>
      <button className="gold-button quiz-next" type="submit" disabled={!selectedIds.length}>{!confirmed ? 'Xác nhận đáp án' : index === total - 1 ? 'Nhận món quà' : 'Câu tiếp theo'}{confirmed ? <ArrowRight size={16} /> : <Check size={16} />}</button>
    </div>
  </form>;
}
