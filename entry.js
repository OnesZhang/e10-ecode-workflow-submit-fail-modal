/**
 * 流程提交失败提示 —— 弹窗化（前端入口，前置加载）
 *
 * 需求：流程详情页提交失败时，平台会在顶部信息提示区渲染一条内联红色横幅
 * （`.wffp-operate-msgTip`，标题「流程提交失败」）。业务侧希望改为弹窗展示。
 *
 * 实现方式：
 * - 复写流程详情页区块插槽组件 `weappWorkflow.FPDevBlockSlot`（官方二开口子），
 *   仅在「顶部信息提示区」后置插槽（blockType=Prompts / slotPlace=after）挂载自定义组件；
 * - 其余插槽原样透传 `<Com {...props} ref={ref} />`，保留原 props、事件与 ref；
 * - 入口只做注册，业务组件用 asyncImport 异步加载，避免前置包体积膨胀。
 *
 * 生效范围：PC 流程详情页（/sp/workflow/flowpage/*），限定逻辑在业务组件内。
 */
import React from 'react';
import { regOvComponent } from '@weapp/utils';
import { asyncImport } from '@weapp/ecodesdk';

/**
 * 异步加载弹窗组件。
 * 重要：'${appId}' 是 E10 平台的运行时占位符，平台会自动替换为实际 appId，不要改成字面量。
 */
const WorkflowSubmitFailModal = React.lazy(() => {
  return asyncImport('${appId}', 'coms/WorkflowSubmitFailModal').catch((error) => {
    // 加载失败时不做任何改动，流程页仍按平台原样展示内联提示
    console.error('[workflow-submit-fail-modal] 弹窗组件加载失败，保持平台原提示', error);
    return { default: () => null };
  });
});

/**
 * 复写区块插槽组件。
 * order=1 与官方「流程详情页面-二开口子」示例保持一致。
 *
 * 注意：目标插槽同时保留 `<Com {...props} ref={ref} />`，
 * 避免覆盖其他 ecode 应用注册到同一插槽的内容（非目标隔离）。
 */
regOvComponent('weappWorkflow', 'FPDevBlockSlot', (Com) => {
  return React.forwardRef((props, ref) => {
    if (props.blockType === 'Prompts' && props.slotPlace === 'after') {
      return (
        <React.Fragment>
          <Com {...props} ref={ref} />
          <React.Suspense fallback={null}>
            <WorkflowSubmitFailModal />
          </React.Suspense>
        </React.Fragment>
      );
    }
    return <Com {...props} ref={ref} />;
  });
}, 1);
