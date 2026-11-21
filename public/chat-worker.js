// ES module worker served beside index.html, including under a Pages project path.
const runtime = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2/dist/transformers.min.js';
const modelId = 'HuggingFaceTB/SmolLM2-360M-Instruct';
const revision = 'a10cc1512eabd3dde888204e902eca88bddb4951';
let generator;
let generating = false;

self.onmessage = async ({data}) => {
    if (generating) return;
    generating = true;
    const post = (type, text) => self.postMessage({type, text});
    try {
        const {pipeline, env, TextStreamer} = await import(runtime);
        if (!generator) {
            env.allowLocalModels = false;
            env.backends.onnx.wasm.numThreads = 1;
            post('status', 'Loading SmolLM2 on this device…');
            let lastUpdate = 0;
            generator = await pipeline('text-generation', modelId, {
                revision, device: 'wasm', dtype: 'int8',
                progress_callback(event) {
                    if (event.status === 'progress' && Date.now() - lastUpdate > 200) {
                        lastUpdate = Date.now();
                        const size = (event.loaded / 1000000).toFixed(1) + ' MB';
                        post('status', 'Loading ' + event.file + ' · ' + size + (event.total ? ' of ' + Math.ceil(event.total / 1000000) + ' MB' : ''));
                    }
                    if (event.status === 'done') post('status', 'Preparing model files…');
                }
            });
        }
        post('status', 'Generating on this device…');
        const streamer = new TextStreamer(generator.tokenizer, {
            skip_prompt: true, skip_special_tokens: true,
            callback_function: text => post('token', text)
        });
        const result = await generator(data.messages, {
            max_new_tokens: 384, do_sample: true, temperature: 0.65,
            top_p: 0.92, repetition_penalty: 1.08, return_full_text: false, streamer
        });
        const generated = result[0].generated_text;
        const answer = typeof generated === 'string' ? generated : generated[generated.length - 1].content;
        if (!answer.trim()) throw new Error('The model returned an empty reply.');
        post('done', answer.trim());
    } catch (error) {
        post('error', error.message || String(error));
    } finally {
        generating = false;
    }
};
