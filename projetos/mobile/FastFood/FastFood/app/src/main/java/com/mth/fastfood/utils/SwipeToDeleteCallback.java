package com.mth.fastfood.utils;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.view.View;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.ItemTouchHelper;
import androidx.recyclerview.widget.RecyclerView;
import androidx.recyclerview.widget.RecyclerView.ViewHolder;
import com.mth.fastfood.R;

abstract public class SwipeToDeleteCallback extends ItemTouchHelper.Callback {
    
    private Context mContext;
    private Paint mClearPaint;
    private ColorDrawable mBackground;
    private int backgroundColor;
    private Drawable deleteDrawable;
    private int intrinsicWidth;
    private int intrinsicHeight;
    
    public SwipeToDeleteCallback(Context ctx) {
        this.mContext = ctx;
        mBackground = new ColorDrawable();
        backgroundColor = mContext.getResources().getColor(R.color.red_500);
        mClearPaint = new Paint();
        mClearPaint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.CLEAR));
        deleteDrawable = ContextCompat.getDrawable(mContext, R.drawable.ic_delete);
        deleteDrawable.setTint(Color.WHITE);
        intrinsicWidth = deleteDrawable.getIntrinsicWidth();
        intrinsicHeight = deleteDrawable.getIntrinsicHeight();
        
    }
    
    @Override
    public int getMovementFlags(RecyclerView recycler, ViewHolder holder) {
        int r = makeMovementFlags(0, ItemTouchHelper.LEFT);
        return r;
    }
    
    @Override
    public boolean onMove(RecyclerView recycler, ViewHolder holder1, ViewHolder holder2) {
        return false;
    }
    
    @Override
    public void onChildDraw(Canvas canvas, RecyclerView recycler, ViewHolder holder, float dX, float dY, int actionState, boolean isCurrentlyActive) {
        super.onChildDraw(canvas, recycler, holder, dX, dY, actionState, isCurrentlyActive);
        
        View itemView = holder.itemView;
        int itemHeight = itemView.getHeight();
        
        boolean isCancelled = dX == 0 && !isCurrentlyActive;
        
        if (isCancelled) {
            clearCanvas(canvas, itemView.getRight() + dX, (float) itemView.getTop(), (float) itemView.getRight(), (float) itemView.getBottom());
            super.onChildDraw(canvas, recycler, holder, dX, dY, actionState, isCurrentlyActive);
            return;
        }
        
        mBackground.setColor(backgroundColor);
        mBackground.setBounds(itemView.getRight() + (int) dX, itemView.getTop(), itemView.getRight(), itemView.getBottom());
        mBackground.draw(canvas);
        
        int deleteIconTop = itemView.getTop() + (itemHeight - intrinsicHeight) / 2;
        int deleteIconMargin = (itemHeight - intrinsicHeight) / 2;
        int deleteIconLeft = itemView.getRight() - deleteIconMargin - intrinsicWidth;
        int deleteIconRight = itemView.getRight() - deleteIconMargin;
        int deleteIconBottom = deleteIconTop + intrinsicHeight;
        
        deleteDrawable.setBounds(deleteIconLeft, deleteIconTop, deleteIconRight, deleteIconBottom);
        deleteDrawable.draw(canvas);
        
        super.onChildDraw(canvas, recycler, holder, dX, dY, actionState, isCurrentlyActive);
    }
    
    public void clearCanvas(Canvas canvas, float left, float top, float right, float bottom) {
        canvas.drawRect(left, top, right, bottom, mClearPaint);
    }
    
    @Override
    public float getSwipeThreshold(ViewHolder holder) {
        return 0.7f;
    }
}
