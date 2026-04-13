import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Brand-styled accessible dropdown replacement for <select>.
 */
export default function CustomSelect({
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = "اختر...",
  ariaLabel,
}) {
  const generatedId = useId();
  const selectId = id || `cselect-${generatedId}`;
  const listboxId = `${selectId}-listbox`;
  const hiddenInputId = `${selectId}-value`;
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const [hasMore, setHasMore] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 2,
        right: window.innerWidth - rect.right,
        width: rect.width,
        zIndex: 9999,
      });
    }

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !menuRef.current) return;

    const element = menuRef.current;
    function checkScrollableHint() {
      setHasMore(element.scrollTop + element.clientHeight < element.scrollHeight - 4);
    }

    checkScrollableHint();
    element.addEventListener("scroll", checkScrollableHint);
    return () => element.removeEventListener("scroll", checkScrollableHint);
  }, [open]);

  function select(optionValue) {
    onChange({ target: { name, value: optionValue } });
    setOpen(false);
  }

  const menu = open
    ? createPortal(
        <div className="cselect__menu-wrap" style={menuStyle}>
          <ul className="cselect__menu" ref={menuRef} role="listbox" id={listboxId}>
            {placeholder && !value ? (
              <li
                className="cselect__option cselect__option--placeholder cselect__option--selected"
                role="option"
                aria-selected="true"
                onClick={() => select("")}
              >
                {placeholder}
              </li>
            ) : null}

            {options.map((option) => (
              <li
                key={option.value}
                className={`cselect__option${option.value === value ? " cselect__option--selected" : ""}`}
                role="option"
                aria-selected={option.value === value}
                onClick={() => select(option.value)}
              >
                {option.value === value ? (
                  <span className="cselect__check" aria-hidden="true">
                    <svg viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M1 5L4.5 8.5L11 1.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                ) : null}
                {option.label}
              </li>
            ))}
          </ul>

          {hasMore ? (
            <div className="cselect__scroll-hint" aria-hidden="true">
              <i className="fa-solid fa-chevron-down" />
            </div>
          ) : null}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className={`cselect${open ? " cselect--open" : ""}`} ref={triggerRef}>
      <input type="hidden" id={hiddenInputId} name={name} value={value ?? ""} readOnly />
      <button
        type="button"
        className="cselect__trigger"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        id={selectId}
        name={name}
      >
        <span className={`cselect__value${!selected ? " cselect__value--placeholder" : ""}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="cselect__arrow" aria-hidden="true">
          <svg viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M1 1.5L6 6.5L11 1.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {menu}
    </div>
  );
}
