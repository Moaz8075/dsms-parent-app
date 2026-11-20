import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Invoice, FeesData } from '../types';

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
const money = (n: number | undefined) => Number(n ?? 0).toLocaleString('en-PK', { maximumFractionDigits: 2 });

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const below100 = (n: number) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`);
const below1000 = (n: number) =>
  n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${below100(n % 100)}` : ''}` : below100(n);

/** 31300 -> "Rupees Thirty One Thousand Three Hundred Only" */
export function amountInWords(amount: number) {
  let n = Math.round(Number(amount ?? 0));
  if (n <= 0) return 'Rupees Zero Only';
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) parts.push(`${below1000(crore)} Crore`);
  if (lakh) parts.push(`${below100(lakh)} Lakh`);
  if (thousand) parts.push(`${below100(thousand)} Thousand`);
  if (n) parts.push(below1000(n));
  return `Rupees ${parts.join(' ')} Only`;
}

const TYPE_LABEL: Record<string, string> = {
  MONTHLY: 'Monthly fee voucher',
  ADMISSION: 'Admission fee voucher',
  ONE_TIME: 'Fee voucher',
  SEMESTER: 'Semester fee voucher',
};
const COPIES = [
  { label: 'Bank Copy', sign: 'Bank officer stamp & signature' },
  { label: 'College Copy', sign: 'Cashier signature' },
  { label: 'Student Copy', sign: 'Received by' },
];

function copyHtml(data: FeesData, v: Invoice, copy: (typeof COPIES)[number]) {
  const bank = data.bank;
  const hasBank = bank && (bank.bankName || bank.accountNumber || bank.iban);
  const feeItems = v.items.filter((i) => !i.isArrears);
  const arrearsItems = v.items.filter((i) => i.isArrears);
  const rows = [
    ...feeItems.map((i) => `<tr><td>${esc(i.description)}</td><td class="r">${money(i.amount)}</td></tr>`),
    ...arrearsItems.map((i) => `<tr class="arr"><td>${esc(i.description)}</td><td class="r">${money(i.amount)}</td></tr>`),
  ].join('');
  return `
  <section class="copy">
    <div class="ribbon">${copy.label}</div>
    <h1>${esc(data.school?.name ?? data.schoolName)}</h1>
    <p class="addr">${esc([data.school?.address, data.school?.phone].filter(Boolean).join(' · '))}</p>
    <h2>${esc(TYPE_LABEL[v.type ?? ''] ?? 'Fee voucher')}${v.period ? ` — ${esc(v.period)}` : ''}</h2>
    <table class="meta">
      <tr><td>Voucher no.</td><td><b>${esc(v.invoiceNumber)}</b></td></tr>
      <tr><td>Issue date</td><td>${esc(v.issuedAt ?? '—')}</td></tr>
      <tr><td>Due date</td><td><b>${esc(v.dueDate ?? '—')}</b></td></tr>
    </table>
    <table class="meta student">
      <tr><td>Student</td><td><b>${esc(data.childName)}</b></td></tr>
      <tr><td>Class</td><td>${esc(data.className ?? '—')}${data.rollNumber ? ` · Roll ${esc(data.rollNumber)}` : ''}</td></tr>
      <tr><td>Parent</td><td>${esc(data.parentName ?? '—')}</td></tr>
    </table>
    <table class="fees">
      <thead><tr><th>Fee details</th><th class="r">Amount (RS)</th></tr></thead>
      <tbody>${rows}
        ${(v.discount ?? 0) > 0 ? `<tr><td>Discount</td><td class="r">- ${money(v.discount)}</td></tr>` : ''}
        ${(v.lateFee ?? 0) > 0 ? `<tr><td>Late fee</td><td class="r">${money(v.lateFee)}</td></tr>` : ''}
        ${v.paidAmount > 0 ? `<tr><td>Already paid</td><td class="r">- ${money(v.paidAmount)}</td></tr>` : ''}
      </tbody>
      <tfoot><tr><td>Payable amount</td><td class="r">${money(v.remaining)}</td></tr></tfoot>
    </table>
    <p class="words">${esc(amountInWords(v.remaining))}</p>
    ${
      hasBank
        ? `<div class="bank"><b>Deposit in bank</b>
      ${bank!.bankName ? `<div><span>Bank</span>${esc(bank!.bankName)}${bank!.branchName ? `, ${esc(bank!.branchName)}` : ''}${bank!.branchCode ? ` (${esc(bank!.branchCode)})` : ''}</div>` : ''}
      ${bank!.accountTitle ? `<div><span>Account title</span>${esc(bank!.accountTitle)}</div>` : ''}
      ${bank!.accountNumber ? `<div><span>Account no.</span><b>${esc(bank!.accountNumber)}</b></div>` : ''}
      ${bank!.iban ? `<div><span>IBAN</span><b>${esc(bank!.iban)}</b></div>` : ''}
    </div>`
        : ''
    }
    ${bank?.instructions ? `<p class="note">${esc(bank.instructions)}</p>` : ''}
    <div class="sign"><span>${copy.sign}</span></div>
  </section>`;
}

const CSS = `
  @page { margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 10px; }
  .page { display: flex; width: 100%; height: 100%; padding: 14px 10px; }
  .copy { flex: 1; padding: 0 8px; border-right: 1px dashed #777; display: flex; flex-direction: column; }
  .copy:last-child { border-right: none; }
  .ribbon { align-self: flex-end; background: #111; color: #fff; padding: 2px 8px; font-size: 8px; font-weight: bold; text-transform: uppercase; }
  h1 { font-size: 12px; margin: 4px 0 0; }
  .addr { margin: 1px 0 4px; font-size: 7.5px; color: #444; }
  h2 { font-size: 9.5px; margin: 3px 0; text-align: center; border-top: 1px solid #111; border-bottom: 1px solid #111; padding: 3px 0; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; }
  .meta td { padding: 1.5px 0; vertical-align: top; }
  .meta td:first-child { width: 30%; color: #444; }
  .student { margin: 3px 0 5px; padding-top: 3px; border-top: 1px dotted #999; }
  .fees th, .fees td { border: 1px solid #999; padding: 3px 5px; }
  .fees th { background: #eee; text-align: left; }
  .fees tfoot td { font-weight: bold; font-size: 11px; background: #f5f5f5; }
  .r { text-align: right; }
  .arr td { color: #b91c1c; font-weight: bold; }
  .words { margin: 4px 0; font-style: italic; font-size: 9px; }
  .bank { border: 1px solid #111; padding: 4px 6px; margin-top: 4px; line-height: 1.5; }
  .bank div span { display: inline-block; width: 62px; color: #444; }
  .note { font-size: 8px; color: #333; margin: 4px 0; }
  .sign { margin-top: auto; padding-top: 18px; }
  .sign span { display: block; border-top: 1px solid #111; padding-top: 2px; font-size: 8px; text-align: center; }
`;

export function buildVoucherHtml(data: FeesData, v: Invoice) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="page">${COPIES.map((c) => copyHtml(data, v, c)).join('')}</div></body></html>`;
}

/** One A4 landscape page with the Bank, College and Student copies; opens the share sheet (save / print / send). */
export async function shareVoucherPdf(data: FeesData, v: Invoice) {
  const { uri } = await Print.printToFileAsync({ html: buildVoucherHtml(data, v), width: 842, height: 595 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Voucher ${v.invoiceNumber}`, UTI: 'com.adobe.pdf' });
  }
  return uri;
}
