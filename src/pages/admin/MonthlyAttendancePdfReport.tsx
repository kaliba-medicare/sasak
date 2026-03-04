import React, { forwardRef } from 'react';

interface PdfReportProps {
  monthYear: string;
  totalWorkingDays: number;
  totalHours: number;
  data: any[];
  jabatan?: string;
}

export const MonthlyAttendancePdfReport = forwardRef<HTMLDivElement, PdfReportProps>(
  ({ monthYear, totalWorkingDays, totalHours, data, jabatan }, ref) => {
    return (
      <div 
        ref={ref} 
        style={{
          width: '297mm', // A4 Landscape
          padding: '20mm',
          backgroundColor: 'white',
          color: 'black',
          fontFamily: 'Times New Roman, serif',
          boxSizing: 'border-box',
        }}
        className="print-container"
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid black', paddingBottom: '10px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0 }}>
            <img src="/logo_lombok_utara.png" alt="Logo Lombok Utara" style={{ width: '80px', height: 'auto' }} crossOrigin="anonymous" />
          </div>
          <div style={{ paddingLeft: '90px' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 5px 0', textTransform: 'uppercase' }}>Pemerintah Kabupaten Lombok Utara</h2>
            <h1 style={{ fontSize: '18px', margin: '0 0 5px 0', fontWeight: 'bold' }}>DINAS KOMUNIKASI DAN INFORMATIKA</h1>
            <h3 style={{ fontSize: '14px', margin: '0', fontWeight: 'normal' }}>
              REKAPITULASI PERSENTASE KEHADIRAN PEGAWAI NEGERI SIPIL / CALON PEGAWAI NEGERI SIPIL
            </h3>
            {jabatan && (
              <h3 style={{ fontSize: '14px', margin: '5px 0 0 0', fontWeight: 'bold' }}>
                JABATAN: {jabatan.toUpperCase()}
              </h3>
            )}
          </div>
        </div>

       

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '30px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>NAMA</th>
              <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>NIP</th>
              <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>JABATAN</th>
              <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>UNIT KERJA</th>
              <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>TK</th>
              <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>HADIR</th>
              <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>TERLAMBAT</th>
              <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>PERSENTASE</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid black', padding: '5px' }}>{row.name}</td>
                <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>{row.nip || '-'}</td>
                <td style={{ border: '1px solid black', padding: '5px' }}>{row.position}</td>
                <td style={{ border: '1px solid black', padding: '5px' }}>{row.department}</td>
                <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>{row.absent_days}</td>
                <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>{row.present_days}</td>
                <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>{row.late_days}</td>
                <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>{row.present_percentage} %</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={7} style={{ border: '1px solid black', padding: '10px', textAlign: 'center' }}>Data kosong</td>
              </tr> 
            )}
          </tbody>
        </table>

        {/* Footer Signatures */}
        <div style={{ display: 'flex', justifyContent: 'right', marginTop: '40px', fontSize: '14px' }}>
          {/* <div style={{ textAlign: 'center', width: '300px' }}>
            <p style={{ marginBottom: '80px' }}>Kepala Badan Kepegawaian dan Pengembangan Sumber Daya Manusia</p>
            <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>ZULFAHRUDIN, MPH</p>
            <p style={{ margin: 0 }}>NIP. 197001011990031014</p>
          </div> */}
          <div style={{ textAlign: 'center', width: '300px' }}>
            <p style={{ marginBottom: '80px' }}>Sekretaris Dinas Komunikasi dan Informatika</p>
            <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>KEN TODI PUTRA, S.Si.,Apt.,M.M.</p>
            <p style={{ margin: 0 }}>NIP. 197801112005011010</p>
          </div>
        </div>
      </div>
    );
  }
);

MonthlyAttendancePdfReport.displayName = 'MonthlyAttendancePdfReport';
