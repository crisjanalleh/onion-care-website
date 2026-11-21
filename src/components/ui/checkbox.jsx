import * as React from "react";
export const Checkbox = React.forwardRef(function Checkbox(props, ref) { return <input ref={ref} type="checkbox" {...props} />; });
