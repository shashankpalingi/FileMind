import React from 'react';
import './Loader.css';

const Loader = ({ message }) => {
    return (
        <div className="loader-overlay">
            <div className="loader-container">
                <div className="spooky-house">
                    <div className="content-circle">
                        <div className="house">
                            <div className="porch" />
                            <div className="first-floor" />
                            <div className="second-floor" />
                            <div className="roof" />
                            <div className="door" />
                            <div className="small-windows" />
                            <div className="big-window" />
                            <div className="frames" />
                        </div>
                        <div className="moon" />
                        <div className="rain">
                            <div className="dropOne" />
                            <div className="dropTwo" />
                            <div className="dropThree" />
                            <div className="dropFour" />
                            <div className="dropFive" />
                        </div>
                    </div>
                </div>
                {message && <p className="loader-message">{message}</p>}
            </div>
        </div>
    );
};

export default Loader;
