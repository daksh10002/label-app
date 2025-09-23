export default function Home(){
  return (
    <div className="card">
      <h1 className="h1">Welcome</h1>
      <p className="text-sm text-muted">
        Use the top nav: <b>Goshudh</b> (2×4″), <b>Trinetra</b> (3×4″), <b>Groshaat</b> (3×4″), <b>Jar</b> (38×25 mm pair).
        Map any SKU to a size with <code>preferred_style_code</code> = <code>'38x25mm' | '2x4in' | '3x4in'</code>.
      </p>
    </div>
  );
}
