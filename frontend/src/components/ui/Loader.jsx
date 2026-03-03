import React from 'react';
import './Loader.css';

const Loader = ({ message = "Processing your files..." }) => {
    return (
        <div className="loader-overlay">
            <div className="loader-container">
                <div className="frame">
                    <div className="scene1">
                        <div className="boy">
                            <div className="boy__head">
                                <div className="boy__hair" />
                                <div className="boy__eyes" />
                                <div className="boy__mouth" />
                                <div className="boy__cheeks" />
                            </div>
                            <div className="noodle" />
                            <div className="boy__leftArm">
                                <div className="chopsticks" />
                            </div>
                        </div>
                        <div className="plate" />
                        <div className="rightArm" />
                    </div>
                    <div className="scene2">5 minutes later</div>
                </div>
                {message && <div className="loader-text">{message}</div>}
            </div>
        </div>
    );
};

export default Loader;
