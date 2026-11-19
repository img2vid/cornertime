import { deserializePreset } from '../serialization';
import PunishmentStateMachine from '../state';
import * as React from 'react';


interface PunishmentLoaderProps {
    fsm: PunishmentStateMachine;
    onBack(): void;
}

interface PunishmentLoaderState {
    preset: string;
    isValid: boolean;
}


export default class PunishmentLoader extends React.Component<PunishmentLoaderProps, PunishmentLoaderState> {
    state = {
        preset: '',
        isValid: false,
    };

    render() {
        return (
            <div className="container my-4">
                <h1>Import a Classic preset</h1>

                <form className="form">
                    <div className="form-group">
                        <label htmlFor="preset-code">Paste your preset</label>
                        <textarea id="preset-code"
                            className="form-control"
                            rows={8}
                            cols={90}
                            value={this.state.preset}
                            onChange={this.onChange}
                        />
                        <small className="form-text text-muted">
                            In either JSON or "BEGIN CORNERTIME CUSTOM PUNISHMENT" format.
                        </small>
                    </div>
                </form>
                <div className="row my-3">
                    <div className="col-md-10">
                        <button
                            className="btn btn-primary btn-block btn-lg"
                            onClick={this.start}
                            disabled={!this.state.isValid}
                        >
                            Start Classic session
                        </button>
                    </div>
                    <div className="col-md-2">
                        <button className="btn btn-secondary btn-block btn-lg" onClick={this.props.onBack}>
                            Back
                        </button>
                    </div>
                </div>


            </div>
        );
    }

    start = (event: React.MouseEvent<HTMLButtonElement>) => {
        const fsm = this.props.fsm;

        fsm.loadPreset(this.loadPreset());
        fsm.getReady();
    }

    loadPreset() {
        try {
            return deserializePreset(this.state.preset);
        } catch (e) {
            return JSON.parse(this.state.preset);
        }
    }

    onChange = (event: React.FormEvent<HTMLTextAreaElement>) => {
        const preset = event.currentTarget.value;

        let isValid = false;
        try {
            deserializePreset(preset);
            isValid = true;
        } catch (e) {
            // noop;
        }

        this.setState({ preset, isValid });
    }
}
