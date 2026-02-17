<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preventivo Template</title>
    <!-- Use Tailwind CDN for simplicity in this template. For production, inline the CSS. -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'] },
                    colors: {
                        primary: '#0f172a',
                        secondary: '#3b82f6',
                    }
                }
            }
        }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @page { margin: 0; size: A4; }
        .page-break { page-break-before: always; }
        .avoid-break { break-inside: avoid; }
    </style>
</head>
<body class="bg-white text-slate-700">
<!-- Main Container A4 size approx in px at 96dpi is ~794x1123, but for print we use auto width -->
<div class="w-full max-w-4xl mx-auto p-12 relative min-h-screen flex flex-col">

    <!-- Header -->
    <header class="flex justify-between items-start border-b-2 border-primary pb-8 mb-8">
        <div class="w-1/2">
            <img src="https://via.placeholder.com/150x50/0f172a/ffffff?text=ELETTROSYSTEM" alt="Logo" class="h-16 object-contain mb-4">
            <div class="text-4xl font-bold text-primary tracking-tight">PREVENTIVO</div>
            <div class="text-secondary font-medium text-lg">#PREV-2023-089</div>
            <div class="text-slate-500 mt-1">Data: 10 ottobre 2023</div>
            <div class="text-xs text-slate-400 mt-1">Valido fino al: 10 novembre 2023</div>
        </div>
        <div class="w-1/2 text-right">
            <h2 class="text-xl font-bold text-slate-800">ElettroSystem S.r.l.</h2>
            <div class="text-slate-500 leading-relaxed mt-2 text-xs">
                Via dell'Elettricità, 42<br>
                20100 Milano<br>
                P.IVA: IT12345678901<br>
                +39 02 1234567 | info@elettrosystem.it<br>
                www.elettrosystem.it
            </div>
        </div>
    </header>

    <!-- Clients Info -->
    <div class="flex justify-between gap-10 mb-10">
        <div class="flex-1">
            <h3 class="text-xs font-bold uppercase tracking-wider text-secondary mb-3 border-b border-slate-100 pb-1">Spett.le Cliente</h3>
            <div class="text-slate-800 font-semibold text-lg">Condominio I Pini</div>
            <div class="text-slate-600 mt-1">
                <div class="font-medium">Amm. Mario Rossi</div>
                Corso Italia, 10<br>
                00100 Roma<br>
                P.IVA/C.F.: 97098765432
            </div>
        </div>
        <div class="flex-1">
            <h3 class="text-xs font-bold uppercase tracking-wider text-secondary mb-3 border-b border-slate-100 pb-1">Dettagli Intervento</h3>
            <div class="mb-3">
                <span class="block text-xs text-slate-400">Oggetto</span>
                <span class="font-medium text-slate-800">Rifacimento impianto videocitofonico e adeguamento normativo</span>
            </div>
            <div>
                <span class="block text-xs text-slate-400">Destinazione</span>
                <span class="font-medium text-slate-800">Ingresso A e B - Via Roma 1, Torino</span>
            </div>
        </div>
    </div>

    <!-- Table -->
    <div class="mb-8">
        <table class="w-full text-left border-collapse">
            <thead>
            <tr class="border-b-2 border-primary text-primary text-xs uppercase tracking-wide">
                <th class="py-2 font-bold w-20">Codice</th>
                <th class="py-2 font-bold">Descrizione</th>
                <th class="py-2 font-bold w-12 text-center">U.M.</th>
                <th class="py-2 font-bold w-12 text-center">Q.tà</th>
                <th class="py-2 font-bold w-24 text-right">Prezzo</th>
                <th class="py-2 font-bold w-16 text-center">Sc.%</th>
                <th class="py-2 font-bold w-12 text-center">IVA</th>
                <th class="py-2 font-bold w-24 text-right">Totale</th>
            </tr>
            </thead>
            <tbody class="text-slate-600 text-sm">
            <!-- SECTION 1 -->
            <tr class="bg-gray-100 border-b border-slate-200">
                <td colspan="7" class="py-2 pl-3 align-middle">
                    <div class="font-bold text-slate-800 uppercase text-xs">CAPITOLO 1: Impianto Videocitofonico (Esterno)</div>
                </td>
                <td class="py-2 text-right font-bold text-slate-800 text-xs align-middle">804,00 €</td>
            </tr>
            <!-- Item 1 -->
            <tr class="border-b border-slate-100">
                <td class="py-3 font-mono text-xs text-slate-500 align-top">BTC-351100</td>
                <td class="py-3 align-top">
                    <div class="font-bold text-slate-800">Modulo A/V Sfera</div>
                    <div class="text-xs mt-1 text-slate-500">Modulo audio video per pulsantiera esterna, ottica grandangolare, IP54.</div>
                </td>
                <td class="py-3 text-center align-top text-xs">pz</td>
                <td class="py-3 text-center align-top">1</td>
                <td class="py-3 text-right align-top">480,00 €</td>
                <td class="py-3 text-center align-top text-xs">-15%</td>
                <td class="py-3 text-center align-top text-xs">22%</td>
                <td class="py-3 text-right font-medium text-slate-800 align-top">408,00 €</td>
            </tr>
            <!-- Item 2 -->
            <tr class="border-b border-slate-100">
                <td class="py-3 font-mono text-xs text-slate-500 align-top">BTC-352000</td>
                <td class="py-3 align-top">
                    <div class="font-bold text-slate-800">Modulo Tasti</div>
                </td>
                <td class="py-3 text-center align-top text-xs">pz</td>
                <td class="py-3 text-center align-top">2</td>
                <td class="py-3 text-right align-top">120,00 €</td>
                <td class="py-3 text-center align-top text-xs">-10%</td>
                <td class="py-3 text-center align-top text-xs">22%</td>
                <td class="py-3 text-right font-medium text-slate-800 align-top">216,00 €</td>
            </tr>
            <!-- Item 3 -->
            <tr class="border-b border-slate-100">
                <td class="py-3 font-mono text-xs text-slate-500 align-top">CAV-BUS</td>
                <td class="py-3 align-top">
                    <div class="font-bold text-slate-800">Cavo BUS 2 fili</div>
                </td>
                <td class="py-3 text-center align-top text-xs">mt</td>
                <td class="py-3 text-center align-top">150</td>
                <td class="py-3 text-right align-top">1,20 €</td>
                <td class="py-3 text-center align-top text-xs">-</td>
                <td class="py-3 text-center align-top text-xs">22%</td>
                <td class="py-3 text-right font-medium text-slate-800 align-top">180,00 €</td>
            </tr>

            <!-- SECTION 2 -->
            <tr class="bg-gray-100 border-b border-slate-200 mt-4">
                <td colspan="7" class="py-2 pl-3 align-middle">
                    <div class="font-bold text-slate-800 uppercase text-xs">CAPITOLO 2: Posti Interni (Agevolata)</div>
                </td>
                <td class="py-2 text-right font-bold text-slate-800 text-xs align-middle">2.793,00 €</td>
            </tr>
            <!-- Item 4 -->
            <tr class="border-b border-slate-100">
                <td class="py-3 font-mono text-xs text-slate-500 align-top">BTC-344672</td>
                <td class="py-3 align-top">
                    <div class="font-bold text-slate-800">Videocitofono Classe 100</div>
                </td>
                <td class="py-3 text-center align-top text-xs">pz</td>
                <td class="py-3 text-center align-top">12</td>
                <td class="py-3 text-right align-top">245,00 €</td>
                <td class="py-3 text-center align-top text-xs">-5%</td>
                <td class="py-3 text-center align-top text-xs">10%</td>
                <td class="py-3 text-right font-medium text-slate-800 align-top">2.793,00 €</td>
            </tr>
            </tbody>
        </table>
    </div>

    <!-- Totals -->
    <div class="flex justify-end mb-10 avoid-break">
        <div class="w-5/12">
            <div class="flex justify-between py-2 border-b border-slate-100">
                <span class="text-slate-500">Imponibile (Netto)</span>
                <span class="font-medium">3.597,00 €</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-100 text-xs text-green-600">
                <span>Sconti Applicati</span>
                <span>- 267,00 €</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span class="text-slate-500">IVA 22%</span>
                <span>176,88 €</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span class="text-slate-500">IVA 10%</span>
                <span>279,30 €</span>
            </div>
            <div class="flex justify-between py-3 border-b-2 border-slate-800 mt-2">
                <span class="font-bold text-lg text-primary">TOTALE</span>
                <span class="font-bold text-lg text-primary">4.053,18 €</span>
            </div>
        </div>
    </div>

    <!-- Terms -->
    <div class="space-y-6 mb-10 text-xs text-slate-600">
        <div class="grid grid-cols-2 gap-8 bg-slate-50 p-6 rounded-lg avoid-break">
            <div>
                <h4 class="font-bold text-slate-800 mb-2">Pagamento</h4>
                <p>Bonifico Bancario: 30% all'ordine, 30% inizio lavori, Saldo a collaudo.</p>
            </div>
            <div>
                <div class="p-2 border border-slate-200 bg-white rounded">
                    <span class="block font-semibold text-slate-700">Coordinate Bancarie</span>
                    <span class="block">Banca Intesa Sanpaolo</span>
                    <span class="font-mono text-slate-900">IT00 X000 0000 0000 0000 0000 00</span>
                </div>
            </div>
        </div>

        <div class="avoid-break">
            <h4 class="font-bold text-secondary text-sm mb-1 uppercase tracking-wider">Note Operative</h4>
            <p class="text-justify leading-relaxed border-l-2 border-secondary pl-3">L'impianto verrà realizzato con marca Bticino...</p>
        </div>
    </div>

    <!-- Footer -->
    <footer class="mt-auto pt-8 border-t border-slate-200">
        <div class="flex justify-between items-end">
            <div class="text-center w-1/3">
                <div class="h-16 border-b border-slate-300 mb-2"></div>
                <div class="text-xs text-slate-400 uppercase tracking-wide">Timbro e Firma Azienda</div>
            </div>
            <div class="text-center w-1/3">
                <div class="h-16 border-b border-slate-300 mb-2"></div>
                <div class="text-xs text-slate-400 uppercase tracking-wide">Timbro e Firma per Accettazione</div>
            </div>
        </div>
    </footer>
</div>
</body>
</html>
