import streamlit as st

st.set_page_config(
    page_title="ANPR Traffic Intelligence",
    page_icon="🚦",
    layout="wide"
)

st.title("🚦 Traffic Intelligence Command Center")

st.success("✅ Streamlit app is running successfully!")

st.write("ANPR Traffic Intelligence test page")

col1, col2, col3 = st.columns(3)

with col1:
    st.metric("TOTAL VEHICLES", 0)

with col2:
    st.metric("DETECTIONS", 0)

with col3:
    st.metric("PLATES READ", 0)

st.divider()

st.info("If you can see this page, Streamlit is working. The problem is inside the previous app.py code.")
