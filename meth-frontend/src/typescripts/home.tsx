import Navigation from "./nav";
import "../styling/index.css";
import FileUploader from "./uploader";
import Footer from "./footer";
import backgroundImage from "../assets/bg-5.jpg";
import Demo from "./demo";

const Home = () => {
    return (
        <div
            className="h-auto text-white flex flex-col bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >

            <Demo/>
            <div className="absolute inset-0 bg-black/40 -z-10"></div>

            <Navigation/>
            <div className="h-20"></div>
            <main className="flex-1 flex items-center justify-center px-6 relative z-10">
                <FileUploader/>
            </main>
            <Footer/>
        </div>
    );
}

export default Home;

