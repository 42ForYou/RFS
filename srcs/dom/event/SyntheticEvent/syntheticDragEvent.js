import SyntheticMouseEvent from "./syntheticMouseEvent.js";
/**
 @ description SyntheticEvent를 확장한 SyntheticDragEvent
 */
const SyntheticDragEvent = SyntheticMouseEvent.extend({
    // 드래그 중인 데이터 전송 객체
    dataTransfer: null,
});

export default SyntheticDragEvent;

// class DragComponent extends React.Component {
//     handleDragStart = (e) => {
//       console.log(`Dragging ${e.target.id}`);
//       e.dataTransfer.setData("text/plain", e.target.id);
//     }

//     render() {
//       return (
//         <div
//           id="draggableElement"
//           draggable="true"
//           onDragStart={this.handleDragStart}
//         >
//           Drag me!
//         </div>
//       );
// }
