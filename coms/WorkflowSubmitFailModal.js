/**
 * 流程提交失败提示 —— 弹窗化
 *
 * 平台在流程详情页顶部提示区渲染 `.wffp-operate-msgTip`（内联红色横幅）。
 * 这里不改写平台内容，只给它挂类名，由 CSS 变成居中弹窗；
 * 平台原有文案、出口条件悬浮提示、「点击这里」跳转逻辑全部保留。
 */
import React from 'react';

const TIP = '.wffp-operate-msgTip';
const CARD = 'wffp-submit-fail-modal-card';
const OPEN = 'wffp-submit-fail-modal-open';
const CLOSED = 'wffp-submit-fail-modal-dismissed';

/** 提示节点只出现在 PC 流程详情页；出现即弹窗，被平台移除即复位 */
function findTip() {
  if (window.location.pathname.indexOf('/sp/workflow/flowpage/') !== 0) return null;
  return document.querySelector(TIP);
}

export default function WorkflowSubmitFailModal() {
  // hidden 页面上没有失败提示 / open 弹窗展开 / closed 用户已关闭，仅留重新查看入口
  const [state, setState] = React.useState('hidden');
  const tipRef = React.useRef(null);

  React.useEffect(() => {
    let queued = false;
    const sync = () => {
      const tip = findTip();
      if (tip === tipRef.current) return;
      if (tipRef.current) tipRef.current.classList.remove(CARD);
      tipRef.current = tip;
      if (tip) tip.classList.add(CARD);
      setState(tip ? 'open' : 'hidden');
    };
    const onMutate = () => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(() => {
        queued = false;
        sync();
      });
    };
    sync();
    const observer = new MutationObserver(onMutate);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (tipRef.current) tipRef.current.classList.remove(CARD);
    };
  }, []);

  React.useEffect(() => {
    document.body.classList.toggle(OPEN, state === 'open');
    document.body.classList.toggle(CLOSED, state === 'closed');
    return () => document.body.classList.remove(OPEN, CLOSED);
  }, [state]);

  React.useEffect(() => {
    if (state !== 'open') return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setState('closed');
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [state]);

  if (state === 'hidden') return null;

  if (state === 'closed') {
    return (
      <button type="button" className="wffp-submit-fail-modal-reopen" onClick={() => setState('open')}>
        流程提交失败，查看原因
      </button>
    );
  }

  return (
    <React.Fragment>
      <div className="wffp-submit-fail-modal-mask" onClick={() => setState('closed')} />
      <button
        type="button"
        className="wffp-submit-fail-modal-close"
        aria-label="关闭"
        onClick={() => setState('closed')}
      >
        ×
      </button>
    </React.Fragment>
  );
}
