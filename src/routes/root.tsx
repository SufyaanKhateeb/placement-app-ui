import ShapesAnimation from "@/components/root-ui/shapes-animation";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Root() {
    return (
        <section className="hero relative w-full mt-6">
            <div className="max-w-7xl mx-auto relative">
                <div className="relative w-full rounded-3xl z-[1] bg-[#fbfaf9] dark:bg-transparent dark:border min-h-screen">
                    <ShapesAnimation />
                    {/* <h1>Root</h1>
                    <Link to={"/protected"}>Protected Page</Link> */}
                    {/* <div className="pt-14 p-4">
                        Helloworld
                        <Button className="shadow-buttonShadow">Link to demo site</Button>
                    </div> */}
                </div>
            </div>
        </section>
    );
}
