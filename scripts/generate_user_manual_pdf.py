import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        if self._pageNumber > 1:
            # Header
            self.drawString(54, 11 * inch - 36, "KNIGHT.VAULT — User Manual, System Architecture & Troubleshooting Guide")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)

            # Footer
            self.drawString(54, 36, "KNIGHT.VAULT Protocol Manual • Architect: Kshitij Adakane")
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(8.5 * inch - 54, 36, page_text)
            self.line(54, 46, 8.5 * inch - 54, 46)

        self.restoreState()

def build_pdf(filename="Midnight_Vault_User_Manual_and_Architecture_Guide.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Palette
    C_PRIMARY = colors.HexColor("#0f172a") # Slate 900
    C_ACCENT = colors.HexColor("#0284c7")  # Cyan
    C_MINT = colors.HexColor("#059669")    # Mint
    C_INDIGO = colors.HexColor("#4f46e5")  # Indigo
    C_TEXT = colors.HexColor("#1e293b")    # Slate 800
    C_MUTED = colors.HexColor("#475569")   # Slate 600
    C_BG_CARD = colors.HexColor("#f8fafc") # Card BG
    C_BORDER = colors.HexColor("#cbd5e1")  # Border
    C_CODE_BG = colors.HexColor("#f1f5f9") # Code BG

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=21,
        leading=27,
        textColor=C_PRIMARY,
        spaceAfter=10
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=C_MUTED,
        spaceAfter=16
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13.5,
        leading=17,
        textColor=C_PRIMARY,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=C_INDIGO,
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=C_TEXT,
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'Code',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#0f172a")
    )

    story = []

    def add_code(code_text):
        clean_code = code_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br/>').replace(' ', '&nbsp;')
        p = Paragraph(clean_code, code_style)
        t = Table([[p]], colWidths=[504])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), C_CODE_BG),
            ('BOX', (0, 0), (-1, -1), 0.5, C_BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(Spacer(1, 3))
        story.append(t)
        story.append(Spacer(1, 5))

    def add_callout(text, bg_color=colors.HexColor("#eff6ff"), border_color=colors.HexColor("#93c5fd")):
        p = Paragraph(text, body_style)
        t = Table([[p]], colWidths=[504])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), bg_color),
            ('BOX', (0, 0), (-1, -1), 1, border_color),
            ('TOPPADDING', (0, 0), (-1, -1), 7),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        story.append(Spacer(1, 3))
        story.append(t)
        story.append(Spacer(1, 5))

    # ================= COVER =================
    story.append(Spacer(1, 8))
    story.append(Paragraph("KNIGHT.VAULT — USER MANUAL & RUNTIME SPECIFICATION", title_style))
    story.append(Paragraph("A Comprehensive Handbook for Operating, Deploying, and Troubleshooting Confidential Zero-Knowledge Settlement Vaults on Midnight Network", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=C_ACCENT, spaceBefore=0, spaceAfter=12))

    meta = [
        [Paragraph("<b>Target Network:</b> Midnight Preprod", body_style), Paragraph("<b>DApp Name:</b> KNIGHT.VAULT", body_style)],
        [Paragraph("<b>Smart Contract:</b> Compact Circuits (payment.compact)", body_style), Paragraph("<b>ZK Proof Engine:</b> Docker Local Port :6300 / Railway", body_style)],
        [Paragraph("<b>Wallet API:</b> Midnight Lace DApp Connector", body_style), Paragraph("<b>Architect:</b> Kshitij Adakane", body_style)]
    ]
    t_meta = Table(meta, colWidths=[252, 252])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_BG_CARD),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 12))

    # ================= SECTION 1 =================
    story.append(Paragraph("1. Developer Setup & Prerequisites", h1_style))
    story.append(Paragraph(
        "To execute transactions and run proof synthesis locally, the developer environment requires three primary subsystems:",
        body_style
    ))
    story.append(Paragraph("• <b>WSL2 (Ubuntu 22.04 LTS):</b> Required on Windows to host the native Linux Compact toolchain and prover libraries.", bullet_style))
    story.append(Paragraph("• <b>Docker ProofServer (Port 6300):</b> Synthesizes zero-knowledge proofs on your machine in 2-4 seconds.", bullet_style))
    story.append(Paragraph("• <b>Midnight Lace Browser Wallet:</b> Manages unshielded/shielded keys, signs transactions, and relays sponsored dust fees.", bullet_style))

    story.append(Paragraph("1.1 Docker ProofServer Deployment & Port Verification", h2_style))
    story.append(Paragraph("Run the proof server container and ensure it is listening on localhost:", body_style))
    add_code("docker run -d --name proof-server -p 6300:6300 midnightnetwork/proof-server:latest\n# Health check command:\ncurl http://localhost:6300/health")
    add_callout("<b>WSL2 Memory Note:</b> Ensure your <code>.wslconfig</code> has at least 8GB-12GB RAM allocated. Proving large ZK circuits may fail with an unhandled exit code if memory is constrained below 4GB.", bg_color=colors.HexColor("#fffbeb"), border_color=colors.HexColor("#fcd34d"))

    # ================= SECTION 2 =================
    story.append(Paragraph("2. User Operations: Deposit & Withdraw", h1_style))
    
    story.append(Paragraph("2.1 Depositing Funds (Zero-Gas Payer Flow)", h2_style))
    story.append(Paragraph("1. Open the KNIGHT.VAULT dashboard at <code>http://localhost:5173/</code>.", bullet_style))
    story.append(Paragraph("2. Click <b>'Connect Wallet'</b> and authorize permissions on the popup modal.", bullet_style))
    story.append(Paragraph("3. Enter the deposit amount (e.g. 50 tNIGHT) in the <b>'Inflow Channel'</b> card.", bullet_style))
    story.append(Paragraph("4. Click <b>'Execute Confidential Inflow'</b>. The Lace wallet balances the transaction with sponsored dust automatically.", bullet_style))

    story.append(Paragraph("2.2 Zero-Knowledge Withdrawal Flow", h2_style))
    story.append(Paragraph("1. Navigate to the <b>'Private Liquidity Release'</b> card.", bullet_style))
    story.append(Paragraph("2. Enter the withdrawal amount and recipient unshielded address (or public key).", bullet_style))
    story.append(Paragraph("3. Click <b>'Authorize ZK Withdrawal'</b>. The local ProofServer will compute the witness proof.", bullet_style))
    story.append(Paragraph("4. Once synthesized, the transaction is committed to Midnight Preprod with zero private data leaked.", bullet_style))

    # ================= SECTION 3 =================
    story.append(Paragraph("3. Real-World Troubleshooting & FAQs", h1_style))

    faq_data = [
        [Paragraph("<b>Issue / Error</b>", body_style), Paragraph("<b>Root Cause & Recommended Solution</b>", body_style)],
        [Paragraph("<b>ProofServer Unreachable (Port 6300)</b>", body_style), Paragraph("Docker container is stopped or port is blocked by Windows Firewall. Run <code>docker restart proof-server</code> and verify with <code>curl http://localhost:6300/health</code>.", body_style)],
        [Paragraph("<b>Lace Wallet 'offset: null' Error</b>", body_style), Paragraph("Known bug in Midnight Indexer v4 GraphQL schema when pagination offset is null. The KNIGHT.VAULT client includes an automatic filter polyfill.", body_style)],
        [Paragraph("<b>Insufficient Dust Balance</b>", body_style), Paragraph("The Lace wallet needs a small unshielded balance to derive dust. Request 10 tNIGHT from the Midnight faucet to refresh coin notes.", body_style)],
        [Paragraph("<b>Vite / Browser Polyfill Errors</b>", body_style), Paragraph("Node.js stream/crypto modules must be polyfilled in browser builds. Ensure <code>vite-plugin-node-polyfills</code> is included in <code>vite.config.ts</code>.", body_style)]
    ]
    t_faq = Table(faq_data, colWidths=[160, 344])
    t_faq.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_ACCENT),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BACKGROUND', (0,1), (-1,-1), C_BG_CARD),
        ('GRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_faq)
    story.append(Spacer(1, 10))

    # ================= SECTION 4 =================
    story.append(Paragraph("4. Summary & Architect Credits", h1_style))
    story.append(Paragraph(
        "KNIGHT.VAULT demonstrates modern, institutional-grade zero-knowledge engineering. Designed and built by <b>Kshitij Adakane</b>.",
        body_style
    ))
    add_callout("<b>Open Source Codebase:</b> https://github.com/KSHITIJadakane/KNIGHT.VAULT", bg_color=colors.HexColor("#f0fdf4"), border_color=colors.HexColor("#86efac"))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] User manual generated: {filename}")

if __name__ == "__main__":
    out = "Midnight_Vault_User_Manual_and_Architecture_Guide.pdf"
    if len(sys.argv) > 1:
        out = sys.argv[1]
    build_pdf(out)
