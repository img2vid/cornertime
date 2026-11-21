import * as React from 'react';
import { compareFrames, height, luminance, width } from '../monitoring';

interface Props {
    cameraEnabled?: boolean;
    preparing: boolean;
    onMotion: (value: number) => void;
}

export default class SessionMonitor extends React.Component<Props> {
    state = { camera: 'Opening camera…', position: 'Waiting for camera', motion: '—' };
    private active = false;
    private timer = 0;
    private video = document.createElement('video');
    private canvas = document.createElement('canvas');
    private camera?: MediaStream;
    private previous?: Uint8Array;
    private reference?: Uint8Array;

    componentDidMount() {
        this.active = true;
        this.canvas.width = width;
        this.canvas.height = height;
        this.video.muted = true;
        this.video.setAttribute('playsinline', '');
        if (this.props.cameraEnabled !== false) { this.openCamera(); }
        else { this.setState({ camera: 'Camera off', position: 'Off' }); }
        this.timer = window.setInterval(this.sample, 100);
    }

    componentWillUnmount() {
        this.active = false;
        window.clearInterval(this.timer);
        this.closeCamera();
    }

    private closeCamera = () => {
        if (this.camera) {
            this.camera.getTracks().forEach(track => track.stop());
            this.camera = undefined;
        }
        this.video.srcObject = null;
    }

    private cameraFailed = () => {
        this.closeCamera();
        if (this.active) {
            this.setState({ camera: 'Camera unavailable', position: 'Unavailable', motion: '—' });
        }
    }

    private async openCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            if (!this.active) {
                stream.getTracks().forEach(track => track.stop());
                return;
            }
            this.camera = stream;
            stream.getVideoTracks()[0].onended = this.cameraFailed;
            this.video.srcObject = stream;
            await this.video.play();
            if (this.active && this.camera) { this.setState({ camera: 'Camera active' }); }
        } catch {
            this.cameraFailed();
        }
    }

    private sample = () => {
        if (!this.camera || this.camera.getVideoTracks()[0].muted || this.video.readyState < 2) {
            return;
        }
        const ctx = this.canvas.getContext('2d');
        if (!ctx) { this.cameraFailed(); return; }
        ctx.drawImage(this.video, 0, 0, width, height);
        const frame = luminance(ctx.getImageData(0, 0, width, height).data);
        const motion = this.previous ? compareFrames(frame, this.previous).peak : 0;
        this.previous = frame;
        this.props.onMotion(motion);
        if (this.props.preparing || !this.reference) { this.reference = frame; }
        const { shifted, changedTiles } = compareFrames(frame, this.reference);
        this.setState({
            motion: Math.round(motion * 100) + '%',
            position: this.props.preparing ? 'Stand in your starting position' :
                (shifted ? 'Changed from starting view' : 'Near starting view') + ' · ' + changedTiles + ' changed tiles',
        });
    }

    render() {
        return <section className="container text-center" aria-label="Session monitoring">
            <p>{this.state.camera} · Movement: {this.state.motion}</p>
            <p>Position: {this.state.position}</p>
        </section>;
    }
}
