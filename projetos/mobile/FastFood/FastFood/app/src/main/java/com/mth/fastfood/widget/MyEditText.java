package com.mth.fastfood.widget;

import android.content.Context;
import android.content.res.ColorStateList;
import android.content.res.TypedArray;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.text.InputType;
import android.util.AttributeSet;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import com.mth.fastfood.R;
import android.widget.Toast;

public class MyEditText extends LinearLayout {
    
    private Context mContext;
    
    private EditText mEditText;
    private ImageView mImageViewLeft;
    private ImageButton mImageViewRight;
    
    private Drawable iconLeft;
    private Drawable iconRight;
    
    private String hint;
    private int inputType;
    private int imeOptions;
    private float textSize;
    private boolean enabled = true;
    
    public static final int INPUT_TYPE_TEXT = 0;
    public static final int INPUT_TYPE_PERSON_NAME = 1;
    public static final int INPUT_TYPE_EMAIL = 2;
    public static final int INPUT_TYPE_PHONE = 3;
    public static final int INPUT_TYPE_PASSWORD = 4;
    
    public static final int IME_OPTIONS_DONE = 1;
    public static final int IME_OPTIONS_NEXT = 2;
    public static final int IME_OPTIONS_PREVIOUS = 3;
    
    public MyEditText(Context ctx) {
        super(ctx);
        this.mContext = ctx;
        
        start();
        
    }
    
    public MyEditText(Context ctx, AttributeSet attr) {
        super(ctx, attr);
        this.mContext = ctx;
        
        TypedArray array = mContext.obtainStyledAttributes(attr, R.styleable.MyEditText);
        
        try {
            setIconLeft(array.getDrawable(R.styleable.MyEditText_iconLeft));
            setIconRight(array.getDrawable(R.styleable.MyEditText_iconRight));
            setHint(array.getString(R.styleable.MyEditText_hint));
            setInputType(array.getInt(R.styleable.MyEditText_inputType, 0));
            setImeOptions(array.getInt(R.styleable.MyEditText_imeOptions, 0));
            //setTextSize(array.getDimension(R.styleable.MyEditText_textSize, 16));
            //setEnabled(array.getBoolean(R.styleable.MyEditText_enabled, true))
            
        }finally {
            array.recycle();
        }
        
        start();
    }
    
    protected void start() {
        this.setBackground(getResources().getDrawable(R.drawable.edittext_input));
        this.setOrientation(HORIZONTAL);
        this.setGravity(Gravity.CENTER_VERTICAL);
        
        int icon_size_edit_text = (int) getResources().getDimension(R.dimen.icon_size_edit_text);
        int iconMargin = (int) getResources().getDimension(R.dimen.margin_normal);
        
        if (iconLeft != null) {
            mImageViewLeft = new ImageView(mContext);
                
            LayoutParams vlp = new LayoutParams(
                icon_size_edit_text,
                icon_size_edit_text
            );
            vlp.setMargins(0, 0, iconMargin, 0);
            mImageViewLeft.setLayoutParams(vlp);
            mImageViewLeft.setImageDrawable(getIconLeft());
            mImageViewLeft.setScaleType(ImageView.ScaleType.CENTER_CROP);
            mImageViewLeft.setImageTintList(ColorStateList.valueOf(Color.BLACK));
            
            this.addView(mImageViewLeft);
        }
        
        mEditText = new EditText(mContext);
        LinearLayout.LayoutParams llp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.MATCH_PARENT,
            1.0f
        );
        
        mEditText.setLayoutParams(llp);
        mEditText.setBackgroundColor(Color.TRANSPARENT);
        mEditText.setPadding(0, 0, 0, 0);
        mEditText.setSingleLine(true);
        mEditText.setGravity(Gravity.CENTER_VERTICAL);
        mEditText.setTextSize(14);
        mEditText.setEnabled(getEnabled());
        
        if (!getHint().equals("")) {
            mEditText.setHint(getHint());
        }
        
        switch (getInputType()) {
            case INPUT_TYPE_TEXT:
                mEditText.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_NORMAL);
            break;
            
            case INPUT_TYPE_PERSON_NAME:
                mEditText.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PERSON_NAME);
            break;
            
            case INPUT_TYPE_EMAIL:
                mEditText.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS);
            break;
            
            case INPUT_TYPE_PASSWORD:
                mEditText.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
            break;
            
            default:
                mEditText.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_NORMAL);
            break;
        }
        
        switch (getImeOptions()) {
            case IME_OPTIONS_NEXT:
                mEditText.setImeOptions(EditorInfo.IME_ACTION_NEXT);
            break;
            
            case IME_OPTIONS_PREVIOUS:
                mEditText.setImeOptions(EditorInfo.IME_ACTION_PREVIOUS);
            break;
            
            case IME_OPTIONS_DONE:
                mEditText.setImeOptions(EditorInfo.IME_ACTION_DONE);
            break;
            
            default:
                mEditText.setImeOptions(EditorInfo.IME_ACTION_DONE);
            break;
        }
        
        this.addView(mEditText);
        
        if (getInputType() == INPUT_TYPE_PASSWORD) {
            //int iconSize_large = (int) getResources().getDimension(R.dimen.icon_size_large);
                
            mImageViewRight = new ImageButton(mContext);
            LinearLayout.LayoutParams vlp = new LinearLayout.LayoutParams(
                icon_size_edit_text,
                icon_size_edit_text,
                0f
            );
            
            vlp.setMargins(iconMargin, 0, 0, 0);
            mImageViewRight.setLayoutParams(vlp);
            mImageViewRight.setScaleType(ImageView.ScaleType.CENTER);
            mImageViewRight.setImageDrawable(getResources().getDrawable(R.drawable.ic_visibility));
            
            mImageViewRight.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    int gt_1 = InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD;
                    int gt_2 = InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD;
                    int type = mEditText.getInputType();
                    
                    if (type == gt_1) {
                        mEditText.setInputType(gt_2);
                        mImageViewRight.setImageDrawable(getResources().getDrawable(R.drawable.ic_visibility_off));
                    }else if (type ==gt_2) {
                        mEditText.setInputType(gt_1);
                        mImageViewRight.setImageDrawable(getResources().getDrawable(R.drawable.ic_visibility));
                    }
                    
                }
            });
            
            this.addView(mImageViewRight);
            
        }
        
        requestLayout();
    }
    
    public void setIconLeft(Drawable res) {
        this.iconLeft = res;
    }
    
    public void setIconRight(Drawable res) {
        this.iconRight = res;
    }
    
    public void setHint(String value) {
        this.hint = value;
    }
    
    public void setInputType(int value) {
        this.inputType = value;
    }
    
    public void setImeOptions(int value) {
        this.imeOptions = value;
    }
    
    public void setTextSize(float value) {
        this.textSize = value;
    }
    
    public void setEnabled(boolean value) {
        this.enabled = value;
    }
    
    public Drawable getIconLeft() {
        return this.iconLeft;
    }
    
    public Drawable getIconRight() {
        return this.iconRight;
    }
    
    public String getHint() {
        return this.hint;
    }
    
    public int getInputType() {
        return this.inputType;
    }
    
    public int getImeOptions() {
        return this.imeOptions;
    }
    
    public float getTextSize() {
        return this.textSize;
    }
    
    public boolean getEnabled() {
        return this.enabled;
    }
    
}
