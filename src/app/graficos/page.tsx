export default function Graficos() {
  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "1rem" }}>Gráfico Power BI</h1>
      <iframe
        title="last"
        width="100%"
        height="600"
        src="https://app.powerbi.com/reportEmbed?reportId=2db49726-e5d5-4659-908a-7667d3a8d706&autoAuth=true&ctid=e631c664-107d-4e97-b93d-1965130d1449&actionBarEnabled=true"
        frameBorder="0"
        allowFullScreen={true}
      ></iframe>
    </div>
  );
}
