from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.units import inch

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image,
    Table,
    TableStyle,
    PageBreak
)


# تجهيز أنماط النصوص المستخدمة في التقرير
def get_pdf_styles():

    styles = getSampleStyleSheet()

    styles.add(
        ParagraphStyle(
            name="ReportTitle",
            parent=styles["Title"],
            fontSize=22,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#263B50"),
            spaceAfter=20
        )
    )

    styles.add(
        ParagraphStyle(
            name="SectionTitle",
            parent=styles["Heading2"],
            fontSize=15,
            textColor=colors.HexColor("#263B50"),
            spaceBefore=15,
            spaceAfter=10
        )
    )

    styles.add(
        ParagraphStyle(
            name="ReportBody",
            parent=styles["BodyText"],
            fontSize=10,
            leading=15,
            spaceAfter=8
        )
    )

    return styles


# إضافة نتائج التحليل إلى التقرير
def add_analysis_results(story, result, styles):

    story.append(
        Paragraph(
            "Analysis Results",
            styles["SectionTitle"]
        )
    )

    # التحقق من وجود نتائج
    if not isinstance(result, dict) or not result:

        story.append(
            Paragraph(
                "No analysis results available.",
                styles["ReportBody"]
            )
        )

        return

    # المرور على أقسام النتائج
    for section_name, section_data in result.items():

        # إضافة عنوان القسم
        story.append(
            Paragraph(
                escape(str(section_name).replace("_", " ").title()),
                styles["Heading3"]
            )
        )

        # تجهيز صفوف الجدول
        table_data = [
            ["Item", "Value"]
        ]

        if isinstance(section_data, dict):

            for key, value in section_data.items():

                if isinstance(value, (dict, list)):
                    value = str(value)

                table_data.append([
                    Paragraph(
                        escape(str(key)),
                        styles["ReportBody"]
                    ),
                    Paragraph(
                        escape(str(value)),
                        styles["ReportBody"]
                    )
                ])

        else:

            table_data.append([
                "Result",
                Paragraph(
                    escape(str(section_data)),
                    styles["ReportBody"]
                )
            ])

        # إنشاء الجدول
        results_table = Table(
            table_data,
            colWidths=[2 * inch, 4 * inch]
        )

        results_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#263B50")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("PADDING", (0, 0), (-1, -1), 7)
            ])
        )

        story.append(results_table)
        story.append(Spacer(1, 12))



        # إضافة شرح الذكاء الاصطناعي إلى التقرير
def add_ai_explanation(story, ai_explanation, styles):

    story.append(
        Paragraph(
            "AI Explanation",
            styles["SectionTitle"]
        )
    )

    # التحقق من وجود شرح
    if not ai_explanation or not str(ai_explanation).strip():

        story.append(
            Paragraph(
                "AI explanation is not available.",
                styles["ReportBody"]
            )
        )

        return

    # تقسيم الشرح إلى فقرات
    explanation_paragraphs = str(
        ai_explanation
    ).split("\n")

    for paragraph in explanation_paragraphs:

        if paragraph.strip():

            story.append(
                Paragraph(
                    escape(paragraph),
                    styles["ReportBody"]
                )
            )

            story.append(Spacer(1, 5))


            # إضافة الرسم البياني المختار إلى التقرير
def add_selected_visualization(story, image_buffer, styles):

    story.append(
        Paragraph(
            "Selected Visualization",
            styles["SectionTitle"]
        )
    )

    # التحقق من وجود صورة الرسم البياني
    if image_buffer is None:

        story.append(
            Paragraph(
                "Visualization is not available.",
                styles["ReportBody"]
            )
        )

        return

    # إعادة مؤشر الصورة إلى البداية
    image_buffer.seek(0)

    # إدراج الرسم البياني مع الحفاظ على أبعاده
    chart_image = Image(
        image_buffer,
        width=6 * inch,
        height=3.8 * inch,
        kind="proportional"
    )

    story.append(chart_image)
    story.append(Spacer(1, 15))

    # إضافة الرسم البياني المختار إلى التقرير
def add_selected_visualization(story, image_buffer, styles):

    story.append(
        Paragraph(
            "Selected Visualization",
            styles["SectionTitle"]
        )
    )

    # التحقق من وجود صورة الرسم البياني
    if image_buffer is None:

        story.append(
            Paragraph(
                "Visualization is not available.",
                styles["ReportBody"]
            )
        )

        return

    # إعادة مؤشر الصورة إلى البداية
    image_buffer.seek(0)

    # إدراج الرسم البياني مع الحفاظ على أبعاده
    chart_image = Image(
        image_buffer,
        width=6 * inch,
        height=3.8 * inch,
        kind="proportional"
    )

    story.append(chart_image)


def generate_pdf_report(
    dataset_name,
    created_at,
    analysis_type,
    selected_columns,
    result,
    image_buffer,
    ai_explanation
):
    pdf_buffer = BytesIO()

    document = SimpleDocTemplate(
        pdf_buffer,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50
    )

    styles = get_pdf_styles()
    story = []

    # عنوان التقرير
    story.append(
        Paragraph("DataNarrator Report", styles["ReportTitle"])
    )

    # معلومات الملف
    story.append(
        Paragraph("Dataset Information", styles["SectionTitle"])
    )

    dataset_table = Table(
        [
            ["Dataset Name", str(dataset_name)],
            ["Analysis Date", str(created_at)]
        ],
        colWidths=[2 * inch, 4 * inch]
    )

    story.append(dataset_table)
    story.append(Spacer(1, 15))

    # ملخص التحليل
    story.append(
        Paragraph("Analysis Overview", styles["SectionTitle"])
    )

    analysis_table = Table(
        [
            ["Analysis Type", str(analysis_type)],
            ["Selected Columns", ", ".join(selected_columns)]
        ],
        colWidths=[2 * inch, 4 * inch]
    )

    story.append(analysis_table)
    story.append(Spacer(1, 15))

    # نتائج التحليل
    add_analysis_results(story, result, styles)

    # الرسم المختار
    add_selected_visualization(story, image_buffer, styles)

    # شرح الذكاء الاصطناعي
    add_ai_explanation(story, ai_explanation, styles)

    document.build(story)

    pdf_buffer.seek(0)

    return pdf_buffer