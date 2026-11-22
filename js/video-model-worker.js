/* The model only chooses passages present in the supplied text. */
self.onmessage=async ({data})=>{
  try {
    const {pipeline,env}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
    env.allowLocalModels=false;
    env.backends.onnx.wasm.numThreads=1;
    const encode=await pipeline('feature-extraction','Xenova/paraphrase-multilingual-MiniLM-L12-v2',{
      revision:'2c4055b12046f11709e9df2c122e59ffbdc2f900',dtype:'int8',device:'wasm',
      progress_callback:p=>{
        if(p.status==='progress' && p.total>10_000_000) self.postMessage({progress:Math.floor(p.progress)});
      }
    });
    self.postMessage({running:true});
    const query='Какое решение приняли, что изменилось и какой вывод можно сделать из этого опыта?';
    const vectors=[];
    const passages=[data.title,query,...data.fragments];
    for(let i=0;i<passages.length;i+=6) {
      const batch=await encode(passages.slice(i,i+6),{pooling:'mean',normalize:true});
      vectors.push(...batch.tolist());
    }
    const [topic,question,...sources]=vectors;
    const dot=(a,b)=>a.reduce((sum,n,i)=>sum+n*b[i],0);
    const chosen=[];
    while(chosen.length<Math.min(3,sources.length)) {
      let best=-1,score=-Infinity;
      sources.forEach((vector,i)=>{
        if(chosen.includes(i)) return;
        const overlap=chosen.length?Math.max(...chosen.map(j=>dot(vector,sources[j]))):0;
        if(overlap>.9) return;
        const value=.6*dot(vector,chosen.length?question:topic)+.4*dot(vector,topic)-.35*overlap;
        if(value>score){best=i;score=value;}
      });
      if(best<0) break;
      chosen.push(best);
    }
    const answer=chosen.sort((a,b)=>a-b).map(i=>data.fragments[i]).join('\n\n');
    if(!answer) throw Error();
    self.postMessage({answer});
  } catch {
    self.postMessage({error:true});
  }
};
