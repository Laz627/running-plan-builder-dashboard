
export default function Card({title, children}:{title?:string; children: React.ReactNode}){
  return (
    <section className="card">
      {title && <h2 className="text-lg font-semibold mb-2">{title}</h2>}
      {children}
    </section>
  );
}
