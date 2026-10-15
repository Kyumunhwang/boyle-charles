import streamlit as st
import streamlit.components.v1 as components
import os

# 페이지 기본 설정
st.set_page_config(
    page_title="중학교 과학 디지털 탐구실 - 보일·샤를의 법칙",
    page_icon="⚛️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# 사이드바 구성 (교사용 및 학생용 안내)
with st.sidebar:
    st.header("🔬 수업 안내 & 탐구 가이드")
    st.markdown("""
    **중학교 과학: 기체의 성질**
    - 🎈 **단원 2: 보일의 법칙** (압력과 부피 관계)
      - 활동하기: 20 mL 주사기 디지털 압력 센서 실험
      - 해보기: 60 mL 주사기 속 기체 입자 충돌 횟수 모형
    - 🥛 **단원 1: 샤를의 법칙** (온도와 부피 관계)
      - 활동하기: 비커 수온 조절 및 피펫 속 색소 이동 실험
      - 해보기: 60℃ 물속 유리병 기체 입자 운동 빠르기 모형
    
    ---
    **💡 활용 팁:**
    1. 시뮬레이션에서 수치를 조절하고 `[📌 표에 기록하기]` 버튼을 누르면 탐구 노트에 자동 입력됩니다.
    2. 모든 작성 내용은 브라우저에 자동 저장됩니다.
    3. 탐구 완료 후 `[📋 나의 탐구 노트]`에서 A4 활동지 형태로 인쇄하거나 PDF로 저장할 수 있습니다.
    """)
    st.info("중학교 과학 교과서의 탐구 과정 및 입자 모형을 그대로 재현한 디지털 가상 실험실입니다.")

def get_bundled_html():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    html_file = os.path.join(base_dir, "index.html")
    css_file = os.path.join(base_dir, "style.css")
    sim_js = os.path.join(base_dir, "js", "sim_engine.js")
    note_js = os.path.join(base_dir, "js", "notebook.js")
    app_js = os.path.join(base_dir, "js", "app.js")

    with open(html_file, "r", encoding="utf-8") as f:
        html = f.read()

    with open(css_file, "r", encoding="utf-8") as f:
        css = f.read()

    with open(sim_js, "r", encoding="utf-8") as f:
        js_sim = f.read()

    with open(note_js, "r", encoding="utf-8") as f:
        js_note = f.read()

    with open(app_js, "r", encoding="utf-8") as f:
        js_app = f.read()

    # CSS 인라인 치환
    html = html.replace(
        '<link rel="stylesheet" href="style.css">',
        f"<style>\n{css}\n</style>"
    )

    # JS 스크립트 인라인 치환
    js_bundle = f"<script>\n{js_sim}\n{js_note}\n{js_app}\n</script>"
    html = html.replace('<script src="js/sim_engine.js"></script>', '')
    html = html.replace('<script src="js/notebook.js"></script>', '')
    html = html.replace('<script src="js/app.js"></script>', js_bundle)

    return html

# 번들링된 HTML 렌더링
bundled_content = get_bundled_html()
components.html(bundled_content, height=1050, scrolling=True)
