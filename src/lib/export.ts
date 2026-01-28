import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'

/**
 * Export data to PDF
 */
export async function exportToPDF(data: {
  title: string
  subtitle?: string
  headers: string[]
  rows: (string | number)[][]
  firmName?: string
  dateRange?: string
}): Promise<Buffer> {
  const doc = new jsPDF()

  // Add header
  doc.setFontSize(20)
  doc.text(data.title, 14, 20)

  if (data.subtitle) {
    doc.setFontSize(12)
    doc.text(data.subtitle, 14, 28)
  }

  // Add firm name and date range
  let yPosition = data.subtitle ? 35 : 28
  doc.setFontSize(10)

  if (data.firmName) {
    doc.text(data.firmName, 14, yPosition)
    yPosition += 6
  }

  if (data.dateRange) {
    doc.text(data.dateRange, 14, yPosition)
    yPosition += 6
  }

  // Add table
  autoTable(doc, {
    head: [data.headers],
    body: data.rows,
    startY: yPosition + 4,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246], // Blue
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Light gray
    },
  })

  // Add footer with page numbers
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  return Buffer.from(doc.output('arraybuffer'))
}

/**
 * Export data to Excel
 */
export async function exportToExcel(data: {
  filename: string
  sheets: {
    name: string
    headers: string[]
    rows: (string | number | null)[][]
    columnWidths?: number[]
  }[]
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'Financial Services Platform'
  workbook.created = new Date()

  for (const sheetData of data.sheets) {
    const worksheet = workbook.addWorksheet(sheetData.name)

    // Add headers
    worksheet.addRow(sheetData.headers)

    // Style headers
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }, // Blue
    }
    headerRow.height = 20

    // Add data rows
    sheetData.rows.forEach(row => {
      worksheet.addRow(row)
    })

    // Set column widths
    if (sheetData.columnWidths) {
      sheetData.columnWidths.forEach((width, index) => {
        worksheet.getColumn(index + 1).width = width
      })
    } else {
      // Auto-fit columns
      worksheet.columns.forEach(column => {
        let maxLength = 0
        column.eachCell?.({ includeEmpty: true }, cell => {
          const cellValue = cell.value?.toString() || ''
          maxLength = Math.max(maxLength, cellValue.length)
        })
        column.width = Math.min(Math.max(maxLength + 2, 10), 50)
      })
    }

    // Add borders and alternating row colors
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        }
      })

      // Alternating row colors (skip header)
      if (rowNumber > 1 && rowNumber % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }, // Light gray
        }
      }
    })
  }

  return Buffer.from(await workbook.xlsx.writeBuffer())
}

/**
 * Export transactions report
 */
export async function exportTransactionsReport(
  transactions: any[],
  format: 'pdf' | 'excel',
  options: {
    firmName?: string
    dateRange?: string
    clientName?: string
  } = {}
): Promise<Buffer> {
  const headers = ['Date', 'Client', 'Description', 'Type', 'Amount', 'Category', 'Status']
  const rows = transactions.map(tx => [
    new Date(tx.date).toLocaleDateString(),
    tx.client?.name || '',
    tx.description || '',
    tx.type,
    `$${tx.amount.toFixed(2)}`,
    tx.category || '',
    tx.status,
  ])

  if (format === 'pdf') {
    return exportToPDF({
      title: 'Transaction Report',
      subtitle: options.clientName ? `Client: ${options.clientName}` : undefined,
      headers,
      rows,
      firmName: options.firmName,
      dateRange: options.dateRange,
    })
  } else {
    return exportToExcel({
      filename: 'transactions.xlsx',
      sheets: [{
        name: 'Transactions',
        headers,
        rows,
        columnWidths: [12, 20, 30, 10, 12, 15, 12],
      }],
    })
  }
}

/**
 * Export invoices report
 */
export async function exportInvoicesReport(
  invoices: any[],
  format: 'pdf' | 'excel',
  options: {
    firmName?: string
    dateRange?: string
  } = {}
): Promise<Buffer> {
  const headers = ['Invoice #', 'Client', 'Issue Date', 'Due Date', 'Amount', 'Paid', 'Status']
  const rows = invoices.map(inv => [
    inv.invoiceNumber,
    inv.client?.name || '',
    new Date(inv.issueDate).toLocaleDateString(),
    new Date(inv.dueDate).toLocaleDateString(),
    `$${inv.total.toFixed(2)}`,
    `$${(inv.paidAmount || 0).toFixed(2)}`,
    inv.status,
  ])

  if (format === 'pdf') {
    return exportToPDF({
      title: 'Invoice Report',
      headers,
      rows,
      firmName: options.firmName,
      dateRange: options.dateRange,
    })
  } else {
    return exportToExcel({
      filename: 'invoices.xlsx',
      sheets: [{
        name: 'Invoices',
        headers,
        rows,
        columnWidths: [15, 20, 12, 12, 12, 12, 12],
      }],
    })
  }
}

/**
 * Export clients report
 */
export async function exportClientsReport(
  clients: any[],
  format: 'pdf' | 'excel',
  options: {
    firmName?: string
  } = {}
): Promise<Buffer> {
  const headers = ['Name', 'Email', 'Entity Type', 'Status', 'Phone', 'Address']
  const rows = clients.map(client => [
    client.name,
    client.email || '',
    client.entityType || '',
    client.status,
    client.phone || '',
    client.address || '',
  ])

  if (format === 'pdf') {
    return exportToPDF({
      title: 'Clients Report',
      headers,
      rows,
      firmName: options.firmName,
    })
  } else {
    return exportToExcel({
      filename: 'clients.xlsx',
      sheets: [{
        name: 'Clients',
        headers,
        rows,
        columnWidths: [20, 25, 15, 12, 15, 30],
      }],
    })
  }
}

/**
 * Export payroll report
 */
export async function exportPayrollReport(
  payrollRuns: any[],
  format: 'pdf' | 'excel',
  options: {
    firmName?: string
    dateRange?: string
  } = {}
): Promise<Buffer> {
  const headers = ['Client', 'Period Start', 'Period End', 'Total Gross', 'Total Net', 'Status']
  const rows = payrollRuns.map(pr => {
    const clientName = pr.client?.businessName ||
      (pr.client?.firstName && pr.client?.lastName
        ? `${pr.client.firstName} ${pr.client.lastName}`
        : pr.client?.name || '')

    return [
      clientName,
      new Date(pr.payPeriodStart).toLocaleDateString(),
      new Date(pr.payPeriodEnd).toLocaleDateString(),
      `$${parseFloat(pr.totalGross || 0).toFixed(2)}`,
      `$${parseFloat(pr.totalNet || 0).toFixed(2)}`,
      pr.status,
    ]
  })

  if (format === 'pdf') {
    return exportToPDF({
      title: 'Payroll Report',
      headers,
      rows,
      firmName: options.firmName,
      dateRange: options.dateRange,
    })
  } else {
    return exportToExcel({
      filename: 'payroll.xlsx',
      sheets: [{
        name: 'Payroll',
        headers,
        rows,
        columnWidths: [20, 12, 12, 12, 12, 12],
      }],
    })
  }
}

/**
 * Export tax returns report
 */
export async function exportTaxReturnsReport(
  taxReturns: any[],
  format: 'pdf' | 'excel',
  options: {
    firmName?: string
  } = {}
): Promise<Buffer> {
  const headers = ['Client', 'Tax Year', 'Type', 'Status', 'Filed Date', 'Due Date']
  const rows = taxReturns.map(tr => {
    const clientName = tr.client?.businessName ||
      (tr.client?.firstName && tr.client?.lastName
        ? `${tr.client.firstName} ${tr.client.lastName}`
        : '')

    return [
      clientName,
      tr.taxYear.toString(),
      tr.returnType,
      tr.status,
      tr.filedDate ? new Date(tr.filedDate).toLocaleDateString() : '',
      new Date(tr.dueDate).toLocaleDateString(),
    ]
  })

  if (format === 'pdf') {
    return exportToPDF({
      title: 'Tax Returns Report',
      headers,
      rows,
      firmName: options.firmName,
    })
  } else {
    return exportToExcel({
      filename: 'tax-returns.xlsx',
      sheets: [{
        name: 'Tax Returns',
        headers,
        rows,
        columnWidths: [20, 10, 15, 12, 12, 12],
      }],
    })
  }
}

/**
 * Export financial summary report
 */
export async function exportFinancialSummary(
  data: {
    revenue: { month: string; amount: number }[]
    expenses: { month: string; amount: number }[]
    profitLoss: { month: string; revenue: number; expenses: number; profit: number }[]
  },
  format: 'pdf' | 'excel',
  options: {
    firmName?: string
    dateRange?: string
  } = {}
): Promise<Buffer> {
  if (format === 'pdf') {
    // For PDF, create a summary table
    const headers = ['Month', 'Revenue', 'Expenses', 'Profit/Loss']
    const rows = data.profitLoss.map(item => [
      item.month,
      `$${item.revenue.toFixed(2)}`,
      `$${item.expenses.toFixed(2)}`,
      `$${item.profit.toFixed(2)}`,
    ])

    return exportToPDF({
      title: 'Financial Summary Report',
      headers,
      rows,
      firmName: options.firmName,
      dateRange: options.dateRange,
    })
  } else {
    // For Excel, create multiple sheets
    return exportToExcel({
      filename: 'financial-summary.xlsx',
      sheets: [
        {
          name: 'Summary',
          headers: ['Month', 'Revenue', 'Expenses', 'Profit/Loss'],
          rows: data.profitLoss.map(item => [
            item.month,
            item.revenue,
            item.expenses,
            item.profit,
          ]),
          columnWidths: [15, 15, 15, 15],
        },
        {
          name: 'Revenue',
          headers: ['Month', 'Amount'],
          rows: data.revenue.map(item => [item.month, item.amount]),
          columnWidths: [15, 15],
        },
        {
          name: 'Expenses',
          headers: ['Month', 'Amount'],
          rows: data.expenses.map(item => [item.month, item.amount]),
          columnWidths: [15, 15],
        },
      ],
    })
  }
}
