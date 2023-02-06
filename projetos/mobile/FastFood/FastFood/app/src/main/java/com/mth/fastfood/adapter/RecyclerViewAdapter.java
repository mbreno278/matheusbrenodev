package com.mth.fastfood.adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.recyclerview.widget.RecyclerView;
import com.mth.fastfood.inter.OnItemClickListener;
import com.mth.fastfood.utils.ProductArray;
import java.util.ArrayList;
import com.mth.fastfood.R;

public class RecyclerViewAdapter extends RecyclerView.Adapter<RecyclerViewAdapter.ViewHolder> {
    
    private Context mContext;
    private int resLayout;
    private ArrayList<ProductArray> array_list = new ArrayList<ProductArray>();
    
    private OnItemClickListener mOnItemClickListener;
    
    public RecyclerViewAdapter(Context ctx, int res, ArrayList<ProductArray> list) {
        this.mContext = ctx;
        this.resLayout = res;
        this.array_list = list;
    }
    
    @Override
    public ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        
        View view = LayoutInflater.from(mContext).inflate(resLayout, parent, false);
        ViewHolder holder = new ViewHolder(view);
        
        return holder;
    }
    
    @Override
    public void onBindViewHolder(ViewHolder holder, int position) {
        
        holder.mImage.setImageResource(array_list.get(position).getImage());
        holder.mTitle.setText(array_list.get(position).getTitle());
        holder.mAdrress.setText(array_list.get(position).getAdrress());
        holder.mCampany_name.setText(array_list.get(position).getCampanyName());
        
    }
    
    @Override
    public int getItemCount() {
        return array_list.size();
    }
    
    public ArrayList<ProductArray> getArrayList() {
        return this.array_list;
    }
    
    public ProductArray getItem(int position) {
        return this.array_list.get(position);
    }
    
    public void removeItem(int position) {
        array_list.remove(position);
        notifyItemRemoved(position);
    }
    
    public void restoreItem(ProductArray item, int position) {
        array_list.add(position, item);
        notifyItemInserted(position);
    }
    
    public void setOnItemClickListener(OnItemClickListener listener) {
        this.mOnItemClickListener = listener;
    }
    
    public class ViewHolder extends RecyclerView.ViewHolder implements View.OnClickListener {
        
        ImageView mImage;
        TextView mTitle;
        TextView mAdrress;
        TextView mCampany_name;
        
        public ViewHolder(View view) {
            super(view);
            
            mImage = (ImageView) view.findViewById(R.id.image);
            mTitle = (TextView) view.findViewById(R.id.title);
            mAdrress = (TextView) view.findViewById(R.id.adrress);
            mCampany_name = (TextView) view.findViewById(R.id.company_name);
            
            view.setOnClickListener(this);
        }
        
        @Override
        public void onClick(View view) {
            int position = getAdapterPosition();
            mOnItemClickListener.onClick(position);
        }
                
    }
}
