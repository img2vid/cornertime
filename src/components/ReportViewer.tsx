import { deserializeReport } from '../serialization';
import * as React from 'react';
import { Report } from '../models';
import ReportCard from './ReportCard';


interface ReportViewerProps {
    onBack(): void;
}


interface ReportViewerState {
    reportSource: string;
    report?: Report;
}


export default class ReportViewer extends React.Component<ReportViewerProps, ReportViewerState> {
    state: ReportViewerState = {
        reportSource: '',
    };

    render() {
        return (
            <div className="container my-4">
                <h1>View a session report</h1>



                <form className="form">
                    <div className="form-group">
                        <label htmlFor="report-code">Paste your report</label>
                        <textarea id="report-code"
                            className="form-control"
                            rows={8}
                            cols={90}
                            value={this.state.reportSource}
                            onChange={this.onChange}
                        />
                        <small className="form-text text-muted">
                            If you instructed someone to take a punishment and received a punishment report
                            from them, enter the report here to view its contents.
                        </small>
                    </div>
                </form>
                <button className="btn btn-secondary btn-block btn-lg my-4" onClick={this.props.onBack}>
                    Back
                </button>

                {this.state.report ? <ReportCard report={this.state.report} /> : null}
            </div>
        );
    }

    onChange = (event: React.FormEvent<HTMLTextAreaElement>) => {
        let reportSource = event.currentTarget.value;
        let report: Report | undefined = undefined;

        try {
            report = deserializeReport(reportSource);
        } catch (e) {
            // Wasn't a valid report. Won't show anything.
        }

        this.setState({ report, reportSource });
    }
}
