import { PrintingLoop } from '@/components/printer/PrintingLoop';

export function PrintingNow() {
  return (
    <section className="sec" id="printer" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="head-row">
          <div>
            <span className="tag accent">Printing now</span>
            <h2 className="d" style={{ marginTop: 16 }}>
              Watch a <span className="hl">part</span> come off the bed.
            </h2>
          </div>
          <p>
            Every part is built one thin layer at a time. The head moves across each layer, then
            steps up to the next one.
          </p>
        </div>
        <PrintingLoop />
      </div>
    </section>
  );
}
