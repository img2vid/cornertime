import * as React from 'react';
import { compareFrames, decibels, height, luminance, width } from '../monitoring';

export interface Reading { tiles?: number; motion?: number; shifted?: boolean; noise?: number; }

interface Props {
    cameraEnabled?: boolean;
    onReading?: (reading: Reading) => void;
    preparing: boolean;
    onMotion: (value: number) => void;
}

export default class SessionMonitor extends React.Component<Props> {
    state = { camera: 'Opening camera…', position: 'Waiting for camera', motion: '—',
        noise: 'Off', microphoneOn: false };
    private active = false;
    private timer = 0;
    private video = document.createElement('video');
    private canvas = document.createElement('canvas');
    private camera?: MediaStream;
    private microphone?: MediaStream;
    private audio?: AudioContext;
    private analyser?: AnalyserNode;
    private samples = new Uint8Array(1024);
    private previous?: Uint8Array;
    private reference?: Uint8Array;
    private audioRequest = 0;

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
        this.closeMicrophone();
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
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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

    private closeMicrophone = () => {
        this.audioRequest++;
        this.analyser = undefined;
        if (this.microphone) {
            this.microphone.getTracks().forEach(track => track.stop());
            this.microphone = undefined;
        }
        if (this.audio) {
            this.audio.close().catch(() => undefined);
            this.audio = undefined;
        }
    }

    private toggleMicrophone = async () => {
        if (this.state.microphoneOn) {
            this.closeMicrophone();
            this.setState({ microphoneOn: false, noise: 'Off' });
            return;
        }
        const request = ++this.audioRequest;
        this.setState({ microphoneOn: true, noise: 'Opening microphone…' });
        try {
            const audio = new AudioContext();
            this.audio = audio;
            const ready = audio.resume();
            // Handle rejection even if the permission dialog stays open.
            ready.catch(() => undefined);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (request !== this.audioRequest) {
                stream.getTracks().forEach(track => track.stop());
                return;
            }
            this.microphone = stream;
            const failed = () => {
                if (request === this.audioRequest) {
                    this.closeMicrophone();
                    this.setState({ microphoneOn: false, noise: 'Microphone unavailable' });
                }
            };
            stream.getAudioTracks()[0].onended = failed;
            await ready;
            if (request !== this.audioRequest) { return; }
            this.analyser = audio.createAnalyser();
            this.analyser.fftSize = this.samples.length;
            audio.createMediaStreamSource(stream).connect(this.analyser);
        } catch {
            if (request === this.audioRequest) {
                this.closeMicrophone();
                this.setState({ microphoneOn: false, noise: 'Microphone unavailable' });
            }
        }
    }

    private sample = () => {
        const reading: Reading = {};
        if (this.analyser && this.audio && this.audio.state === 'running' && this.microphone && !this.microphone.getAudioTracks()[0].muted) {
            this.analyser.getByteTimeDomainData(this.samples);
            const level = decibels(this.samples);
            reading.noise = level;
            this.setState({ noise: isFinite(level) ? level.toFixed(0) + ' dBFS' : 'Silent' });
        }
        if (!this.camera || this.camera.getVideoTracks()[0].muted || this.video.readyState < 2) {
            if (this.props.onReading) { this.props.onReading(reading); }
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
        if (this.props.onReading) { this.props.onReading({ ...reading, motion, shifted, tiles: changedTiles }); }
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
            <p>Noise level: {this.state.noise}</p>
            <button className="btn btn-outline-secondary" onClick={this.toggleMicrophone}>
                {this.state.microphoneOn ? 'Turn microphone off' : 'Enable microphone'}
            </button>
        </section>;
    }
}
