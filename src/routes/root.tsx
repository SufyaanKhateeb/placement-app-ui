import { Link } from "react-router-dom";

export default function Root() {
    return (
        <>
            <div id="sidebar">
            </div>
            <div id="detail">
                <h1>Root</h1>
                <Link to={"/protected"}>Protected Page</Link>
            </div>
        </>
    );
}
