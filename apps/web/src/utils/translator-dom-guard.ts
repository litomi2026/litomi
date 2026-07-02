// 브라우저 페이지 번역이 React 텍스트 노드를 <font>로 감싸 옮기면 commit 단계의 removeChild/insertBefore가 NotFoundError로 죽어요.
// https://github.com/react/react/issues/11538#issuecomment-417504600
export function installTranslatorDomGuard() {
  const { insertBefore, removeChild } = Node.prototype

  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    return child.parentNode === this ? (removeChild.call(this, child) as T) : child
  }

  Node.prototype.insertBefore = function <T extends Node>(node: T, child: Node | null): T {
    return !child || child.parentNode === this ? (insertBefore.call(this, node, child) as T) : node
  }
}
